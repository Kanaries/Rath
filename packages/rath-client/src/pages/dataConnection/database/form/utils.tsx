import { Icon } from '@fluentui/react';
import produce from 'immer';
import type { Dispatch } from 'react';
import type { DatabaseLevelType } from '../options';
import { INestedListItem } from '../components/nested-list-item';
import { DatabaseApiOperator, DatabaseRequestPayload, fetchDatabaseList, fetchSchemaList, fetchTableDetail, fetchTableList } from '../service';
import databaseOptions from '../options';
import { SupportedDatabaseType } from '../interfaces';


export const findNode = (root: INestedListItem[], path: INestedListItem[]): INestedListItem | null => {
    if (path.length === 0) {
        return null;
    }
    const [first] = path;
    for (const item of root) {
        if (item.key === first.key) {
            return path.length === 1 ? item : Array.isArray(item.children) ? findNode(item.children, path.slice(1)) : null;
        }
    }
    return null;
};

export const findNodeByPathId = (root: INestedListItem[], pathId: string): INestedListItem | null => {
    const path = pathId.split('.');
    if (path.length === 0) {
        return null;
    }
    const [first] = path;
    for (const item of root) {
        if (item.key === first) {
            return path.length === 1 ? item : Array.isArray(item.children) ? findNodeByPathId(item.children, path.slice(1).join('.')) : null;
        }
    }
    return null;
};

export const fetchListAsNodes = async (
    levelType: DatabaseLevelType,
    server: string,
    commonParams: Omit<DatabaseRequestPayload<Exclude<DatabaseApiOperator, 'ping'>>, 'func'>,
    hasNextLevelThen: boolean,
): Promise<INestedListItem[] | null> => {
    try {
        switch (levelType) {
            case 'database': {
                const databaseList = await fetchDatabaseList(server, commonParams);
                return databaseList.map<INestedListItem>(database => ({
                    group: 'database',
                    key: database,
                    text: database,
                    isUnloaded: hasNextLevelThen,
                    icon: <Icon iconName="Database" />,
                }));
            }
            case 'schema': {
                const schemaList = await fetchSchemaList(server, commonParams);
                return schemaList.map<INestedListItem>(schema => ({
                    group: 'schema',
                    key: schema,
                    text: schema,
                    isUnloaded: hasNextLevelThen,
                    icon: <Icon iconName="TableGroup" />,
                }));
            }
            case 'table': {
                const tableList = await fetchTableList(server, commonParams);
                return tableList.map<INestedListItem>(table => ({
                    group: 'table',
                    key: table.name,
                    text: table.name,
                    icon: <Icon iconName="Table" />,
                    isUnloaded: false,
                    children: table.meta.map(col => ({
                        group: 'column',
                        key: col.key,
                        subtext: col.dataType ?? undefined,
                        text: col.key,
                        isUnloaded: false,
                        icon: (
                            <Icon
                                iconName={
                                    col.dataType?.match(/(Int|Double|Float|Decimal)/) ? 'NumberField'
                                        : col.dataType?.match(/(String|Char|VarChar)/i) ? 'TextField'
                                        : 'FieldEmpty'
                                }
                            />
                        ),
                    })),
                }));
            }
            default: {
                return null;
            }
        }
    } catch {
        return null;
    }
};

export enum EditorKey {
    Monaco = -1,
    Diagram = -2,
}

export interface MenuType {
    title: string;
    items: INestedListItem[];
    isUnloaded: boolean;
    isFailed?: boolean;
}

export const handleBrowserItemClick = (
    server: string,
    config: (typeof databaseOptions)[number],
    item: INestedListItem,
    path: INestedListItem[],
    commonParams: Omit<DatabaseRequestPayload<Exclude<DatabaseApiOperator, 'ping'>>, 'func'>,
    setMenu: Dispatch<MenuType | ((prev: MenuType) => MenuType)>,
    pages: PageType[],
    setPages: Dispatch<PageType[] | ((prev: PageType[]) => PageType[])>,
    setPageIdx: Dispatch<number>,
): void => {
    const all = [...path, item];
    if (item.isUnloaded || item.isFailed) {
        setMenu(menu => produce(menu, draft => {
            const target = findNode(draft.items, all);
            if (target) {
                target.isUnloaded = true;
                target.isFailed = undefined;
                target.children = undefined;
            }
        }));
        const curLevelIdx = config.levels.findIndex(
            lvl => lvl.type === item.group,
        );
        const nextLevel = curLevelIdx === -1 ? undefined : config.levels[curLevelIdx + 1];
        if (!nextLevel || nextLevel.enumerable === false)  {
            return;
        }
        const hasNextLevelThen = config.levels.length >= curLevelIdx + 2;
        const submit = (list: INestedListItem[]) => {
            setMenu(menu => produce(menu, draft => {
                const target = findNode(draft.items, all);
                if (target) {
                    target.isUnloaded = false;
                    target.isFailed = false;
                    target.children = list;
                }
            }));
        };
        const reject = (err?: any) => {
            if (err) {
                console.warn(err);
            }
            setMenu(menu => produce(menu, draft => {
                const target = findNode(draft.items, all);
                if (target) {
                    target.isUnloaded = false;
                    target.isFailed = true;
                    target.children = undefined;
                }
            }));
        };
        fetchListAsNodes(
            nextLevel.type,
            server,
            commonParams,
            hasNextLevelThen,
        ).then(list => {
            if (list) {
                submit(list);
            } else {
                reject();
            }
        }).catch(reject);
    } else if (item.group === 'table') {
        const pathId = all.map(p => p.key).join('.');
        const idx = pages.findIndex(page => page.id === pathId);
        if (idx === -1) {
            let size = pages.length + 1;
            setPages(pages => produce(pages, draft => {
                size = draft.push({
                    path: all,
                    id: pathId,
                });
            }));
            setPageIdx(size - 1);
        } else {
            setPageIdx(idx);
        }
    }
};

export interface PageType {
    id: string;
    path: INestedListItem[];
}

export const fetchTablePreviewData = async (
    config: (typeof databaseOptions)[number],
    page: PageType,
    params: {
        connectUri: string;
        credentials: Record<string, string>;
        sourceType: SupportedDatabaseType;
        server: string;
    },
): ReturnType<typeof fetchTableDetail> => {
    const payload: Parameters<typeof fetchTableDetail>[1] = {
        uri: params.connectUri,
        sourceType: params.sourceType,
        table: page.path.at(-1)?.key ?? null,
        rowsNum: '100',
        credentials: config.credentials === 'json' ? params.credentials : undefined,
    };
    if (config.levels.some(lvl => lvl.type === 'database')) {
        payload.db = page.path.find(d => d.group === 'database')?.key ?? null;
        if (!payload.db) {
            throw new Error('Database name is required but not given');
        }
    }
    if (config.levels.some(lvl => lvl.type === 'schema')) {
        payload.schema = page.path.find(d => d.group === 'schema')?.key ?? null;
        if (!payload.schema) {
            throw new Error('Schema name is required but not given');
        }
    }
    if (config.credentials === 'json') {
        payload.credentials = params.credentials;
    }
    return fetchTableDetail(params.server, payload);
};
