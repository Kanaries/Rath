import intl from 'react-intl-universal';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import produce from 'immer';
import { Icon, IconButton, Spinner, Theme, useTheme } from '@fluentui/react';
import type { SupportedDatabaseType } from '../type';
import databaseOptions from '../config';
import NestedList, { INestedListItem } from '../components/nested-list';
import useAsyncState from '../../../../../hooks/use-async-state';
import type { TableData } from '../index';
import { DatabaseApiOperator, DatabaseRequestPayload, fetchDatabaseList, fetchQueryResult, fetchSchemaList, fetchTableDetail, fetchTableList } from '../api';
import TablePreview from './table-preview';
import SQLEditor from './query-editor/sql-editor';


const Container = styled.div<{ theme: Theme }>`
    flex-grow: 1;
    flex-shrink: 1;
    flex-basis: 0%;
    min-height: 40vh;
    max-height: 40vh;
    overflow: hidden;
    display: grid;
    grid-template-columns: 16em 1fr;
    grid-template-rows: max-content 1fr;
    border: 1px solid ${({ theme }) => theme.palette.neutralLight};
    font-size: 0.8rem;
    > *:nth-child(2n + 1) {
        :not(header) {
            padding-block: 0.6em;
            padding-inline: 0.5em;
        }
        border-right: 1px solid ${({ theme }) => theme.palette.neutralLight};
        > header, > div > div:first-child {
            margin-inline: 1em;
            margin-bottom: 0.2em;
        }
    }
    > *:first-child {
        padding-block: 0.6em;
        padding-inline: 1.2em;
        display: flex;
        align-items: center;
        user-select: none;
        justify-content: space-between;
        > span {
            flex-grow: 1;
            flex-shrink: 1;
            margin-right: 1em;
        }
    }
    > *:last-child {
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: auto;
    }
`;

const SyncButton = styled(IconButton)<{ busy: boolean }>`
    width: 24px;
    height: 24px;
    background: none;
    i {
        font-size: 0.7rem;
        animation: rotating 2.4s linear infinite;
        ${({ busy }) => busy ? '' : 'animation: none;'}
    }
    @keyframes rotating {
        from {
            transform: rotate(0);
        }
        to {
            transform: rotate(360deg);
        }
    }
`;

const PivotList = styled.div`
    display: flex;
    flex-direction: row;
    align-items: stretch;
    overflow: auto hidden;
    background-color: #fcfcfc;
    > * {
        flex-grow: 0;
        flex-shrink: 0;
    }
`;

const PivotHeader = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    min-width: 6em;
    padding-inline: 1em 0.6em;
    background-color: #f8f8f8;
    cursor: pointer;
    outline: none;
    position: relative;
    :hover {
        background-color: #f2f2f2;
    }
    &[aria-selected="true"] {
        background-image: linear-gradient(to top, currentColor 2px, transparent 2px);
    }
    > span {
        flex-grow: 1;
    }
    > button {
        border-radius: 50%;
        font-size: 100%;
        opacity: 0;
        transform: scale(50%);
        margin-left: 0.6em;
    }
    :hover > button {
        opacity: 1;
    }
`;

const findNode = (root: INestedListItem[], path: INestedListItem[]): INestedListItem | null => {
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

interface QueryOptionsProps {
    disabled: boolean;
    server: string;
    connectUri: string;
    sourceType: SupportedDatabaseType;
    queryString: string;
    setQueryString: (next: string) => void;
}

const QueryOptions: FC<QueryOptionsProps> = ({ server, sourceType, connectUri, disabled, queryString, setQueryString }) => {
    const theme = useTheme();
    const config = databaseOptions.find(opt => opt.key === sourceType);

    const [pages, setPages] = useState<{ id: string; path: INestedListItem[] }[]>([]);
    const [preview, setPreview] = useState<{ [pathId: string | number]: TableData }>({});
    const [pageIdx, setPageIdx] = useState(-1);

    const [menu, setMenu, busy] = useAsyncState<{
        title: string;
        items: INestedListItem[];
    }>({ title: '', items: [] });

    const reload = useCallback(() => {
        if (!config || disabled) {
            setMenu({ title: '', items: [] });
            return;
        }

        const [firstLevel] = config.levels;
        const hasNextLevel = config.levels.length >= 2 && (
            typeof config.levels[1] === 'string' || config.levels[1].enumerable !== false
        );

        if (firstLevel) {
            switch (typeof firstLevel === 'string' ? firstLevel : firstLevel.type) {
                case 'database': {
                    setMenu(
                        fetchDatabaseList(server, { sourceType, uri: connectUri }).then<typeof menu>(
                            list => ({
                                title: 'database',
                                items: list.map(database => ({
                                    group: 'database',
                                    key: database,
                                    text: database,
                                    children: hasNextLevel ? 'lazy' : undefined,
                                    icon: <Icon iconName="Database" />,
                                })),
                            })
                        )
                    );
                    return;
                }
                case 'schema': {
                    setMenu(
                        fetchSchemaList(server, { sourceType, uri: connectUri }).then<typeof menu>(
                            list => ({
                                title: 'schema',
                                items: list.map(schema => ({
                                    group: 'schema',
                                    key: schema,
                                    text: schema,
                                    children: hasNextLevel ? 'lazy' : undefined,
                                    icon: <Icon iconName="TableGroup" />,
                                })),
                            })
                        )
                    );
                    return;
                }
                case 'table': {
                    fetchTableList(server, { sourceType, uri: connectUri }).then<typeof menu>(
                        list => ({
                            title: 'table',
                            items: list.map(table => ({
                                group: 'table',
                                key: table.name,
                                text: table.name,
                                children: table.meta.map(col => ({
                                    group: 'column',
                                    key: col.key,
                                    text: col.key,
                                    icon: (
                                        <Icon
                                            iconName={
                                                col.dataType?.match(/^(Int|Double|Float).*$/) ? 'NumberField'
                                                    : col.dataType?.match(/^(String|Char|VarChar).*$/i) ? 'TextField'
                                                    : 'FieldEmpty'
                                            }
                                        />
                                    ),
                                })),
                            })),
                        })
                    );
                    return;
                }
                default: {
                    break;
                }
            }
        }

        setMenu({ title: '', items: [] });
    }, [disabled, server, sourceType, connectUri, config, setMenu]);
    
    const empty = !config || disabled || !connectUri;
    
    useEffect(() => {
        if (empty) {
            setMenu({ title: '', items: [] });
            setPages([]);
            setPreview({});
        }
    }, [empty, setMenu]);

    useEffect(() => {
        setMenu({ title: '', items: [] });
        setPages([]);
        setPreview({});
    }, [sourceType, connectUri, setMenu]);

    const handleItemClick = (item: INestedListItem, path: INestedListItem[]): void => {
        const all = [...path, item];
        const reversedPath = all.slice().reverse();
        if (config && item.children === 'lazy') {
            const curLevelIdx = config.levels.findIndex(
                lvl => typeof lvl === 'string' ? lvl : lvl.type
            );
            const nextLevel = curLevelIdx === -1 ? undefined : config.levels[curLevelIdx + 1];
            if (!nextLevel || (typeof nextLevel === 'object' && nextLevel.enumerable === false))  {
                return;
            }
            const commonParams: Omit<DatabaseRequestPayload<Exclude<DatabaseApiOperator, 'ping'>>, 'func'> = {
                uri: connectUri,
                sourceType,
                db: reversedPath.find(d => d.group === 'database')?.key ?? null,
                schema: reversedPath.find(d => d.group === 'schema')?.key ?? null,
                table: reversedPath.find(d => d.group === 'table')?.key ?? null,
            };
            const hasNextLevelThen = config.levels.length >= curLevelIdx + 2;
            const submit = (list: INestedListItem[]) => {
                setMenu(menu => produce(menu, draft => {
                    const target = findNode(draft.items, all);
                    if (target) {
                        target.children = list;
                    }
                }));
            };
            switch (typeof nextLevel === 'string' ? nextLevel : nextLevel.type) {
                case 'database': {
                    fetchDatabaseList(server, commonParams).then(list => {
                        submit(list.map(database => ({
                            group: 'database',
                            key: database,
                            text: database,
                            children: hasNextLevelThen ? 'lazy' : undefined,
                            icon: <Icon iconName="Database" />,
                        })));
                    });
                    break;
                }
                case 'schema': {
                    fetchSchemaList(server, commonParams).then(list => {
                        submit(list.map(schema => ({
                            group: 'schema',
                            key: schema,
                            text: schema,
                            children: hasNextLevelThen ? 'lazy' : undefined,
                            icon: <Icon iconName="TableGroup" />,
                        })));
                    });
                    break;
                }
                case 'table': {
                    fetchTableList(server, commonParams).then(list => {
                        submit(list.map(table => ({
                            group: 'table',
                            key: table.name,
                            text: table.name,
                            icon: <Icon iconName="Table" />,
                            children: table.meta.map(col => ({
                                group: 'column',
                                key: col.key,
                                text: col.key,
                                icon: (
                                    <Icon
                                        iconName={
                                            col.dataType?.match(/^(Int|Double|Float).*$/) ? 'NumberField'
                                                : col.dataType?.match(/^(String|Char|VarChar).*$/i) ? 'TextField'
                                                : 'FieldEmpty'
                                        }
                                    />
                                ),
                            })),
                        })));
                    });
                    break;
                }
                default: {
                    break;
                }
            }
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

    const page = pages[pageIdx];
    const curPreview = page ? preview[page.id] : null;

    const commonParamsRef = useRef({ connectUri, sourceType, server });
    commonParamsRef.current = { connectUri, sourceType, server };

    useEffect(() => {
        if (page && page.path.at(-1)?.group === 'table' && !curPreview) {
            fetchTableDetail(commonParamsRef.current.server, {
                uri: commonParamsRef.current.connectUri,
                sourceType: commonParamsRef.current.sourceType,
                db: page.path.find(d => d.group === 'database')?.key ?? null,
                schema: page.path.find(d => d.group === 'schema')?.key ?? null,
                table: page.path.at(-1)?.key ?? null,
                rowsNum: '100',
            }).then(res => {
                setPreview(rec => produce(rec, draft => {
                    draft[page.id] = res;
                }));
            });
        }
    }, [curPreview, page]);

    const doPreview = (id: -1 | -2, query?: string) => {
        fetchQueryResult(commonParamsRef.current.server, {
            uri: commonParamsRef.current.connectUri,
            sourceType: commonParamsRef.current.sourceType,
            query: query ?? queryString,
        }).then(res => {
            setPreview(rec => produce(rec, draft => {
                draft[id] = {
                    // @ts-expect-error
                    columns: 'columns' in res ? res : res.rows.at(0)?.map((_, i) => ({
                        colIndex: i,
                        key: `col_${i + 1}`,
                        dataType: null,
                    })) ?? [],
                    rows: res.rows,
                };
            }));
        });
    };

    return (
        <Container theme={theme}>
            <header>
                <span>
                    {intl.get('dataSource.explorer')}
                </span>
                <SyncButton
                    iconProps={{ iconName: 'SyncOccurence' }}
                    disabled={busy || !config || disabled}
                    busy={busy}
                    onClick={reload}
                    style={{ animation: busy ? undefined : 'none' }}
                />
            </header>
            <PivotList>
                <PivotHeader
                    role="tab"
                    tabIndex={0}
                    aria-selected={pageIdx === -1}
                    onClick={() => setPageIdx(-1)}
                >
                    <span>Query</span>
                </PivotHeader>
                {pages.map((page, i) => (
                    <PivotHeader
                        key={i}
                        role="tab"
                        tabIndex={0}
                        aria-selected={pageIdx === i}
                        onClick={() => setPageIdx(i)}
                    >
                        <span>{page.path.at(-1)?.text}</span>
                        <IconButton
                            iconProps={{ iconName: 'ChromeClose' }}
                            onClick={() => setPages(pages => produce(pages, draft => { draft.splice(i, 1) }))}
                        />
                    </PivotHeader>
                ))}
            </PivotList>
            <NestedList
                loading={busy}
                title={menu.title}
                items={menu.items}
                onItemClick={handleItemClick}
            />
            <div>
                {config && (
                    pageIdx === -1 ? (
                        <SQLEditor
                            setQuery={q => setQueryString(q)}
                            preview={preview[-1] ?? null}
                            doPreview={query => {
                                setQueryString(query);
                                doPreview(-1, query);
                            }}
                        />
                    ) : page && (
                        curPreview ? <TablePreview data={curPreview} /> : <Spinner />
                    )
                )}
            </div>
        </Container>
    );
};


export default observer(QueryOptions);
