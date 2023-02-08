import intl from 'react-intl-universal';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import produce from 'immer';
import { IconButton, Spinner, useTheme } from '@fluentui/react';
import type { SupportedDatabaseType, TableColInfo, TableInfo } from '../type';
import databaseOptions from '../config';
import NestedList, { INestedListItem } from '../components/nested-list';
import type { TableData } from '../index';
import { DatabaseApiOperator, DatabaseRequestPayload, fetchQueryResult, fetchTableDetail } from '../api';
import useAsyncState, { AsyncDispatch } from '../../../../hooks/use-async-state';
import TablePreview from './table-preview';
import SQLEditor from './query-editor/sql-editor';
import { EditorKey, fetchListAsNodes, findNode, findNodeByPathId, PivotHeader, PivotList, QueryContainer, SyncButton } from './utils';
import DiagramEditor from './query-editor/diagram-editor';

interface QueryOptionsProps {
    disabled: boolean;
    server: string;
    connectUri: string;
    sourceType: SupportedDatabaseType;
    queryString: string;
    setQueryString: (next: string) => void;
    editorPreview: { name: string; value: TableData } | null;
    setEditorPreview: AsyncDispatch<
        | { name: string; value: TableData } | Promise<{ name: string; value: TableData } | null>
        | ((prevState: { name: string; value: TableData } | null) => { name: string; value: TableData } | Promise<{ name: string; value: TableData } | null> | null) | null
    >;
    isEditorPreviewPending: boolean;
    submit: (name: string, value: TableData) => void;
}

const QueryOptions: FC<QueryOptionsProps> = ({
    server, sourceType, connectUri, disabled, queryString, setQueryString, editorPreview, setEditorPreview, isEditorPreviewPending, submit,
}) => {
    const theme = useTheme();
    const config = databaseOptions.find(opt => opt.key === sourceType);

    const [pages, setPages] = useState<{ id: string; path: INestedListItem[] }[]>([]);
    const [preview, setPreview] = useState<{ [pathId: string]: TableData | 'failed' }>({});
    const [pageIdx, setPageIdx] = useState<number | EditorKey>(EditorKey.Monaco);

    const [menu, setMenu, busy] = useAsyncState<{
        title: string;
        items: INestedListItem[];
    }>({ title: '', items: [] });

    const reset = useCallback(() => {
        setMenu({ title: '', items: [] });
        setPages([]);
        setPreview({});
        setEditorPreview(null);
    }, [setMenu, setEditorPreview]);

    const reload = useCallback(() => {
        if (!config || disabled) {
            reset();
            return;
        }

        const [firstLevel] = config.levels;
        const hasNextLevel = config.levels.length >= 2 && (
            typeof config.levels[1] === 'string' || config.levels[1].enumerable !== false
        );

        if (firstLevel) {
            const levelType = typeof firstLevel === 'string' ? firstLevel : firstLevel.type;
            setMenu(
                fetchListAsNodes(
                    levelType,
                    server,
                    { sourceType, uri: connectUri },
                    hasNextLevel,
                ).then(list => list ? ({ title: levelType, items: list }) : { title: '', items: [] })
            );
        }

        reset();
    }, [disabled, server, sourceType, connectUri, config, setMenu, reset]);
    
    const empty = !config || disabled || !connectUri;
    
    useEffect(() => {
        if (empty) {
            reset();
        }
    }, [empty, reset]);

    useEffect(() => {
        reset();
    }, [sourceType, connectUri, setMenu, reset]);

    const handleItemClick = (item: INestedListItem, path: INestedListItem[]): void => {
        const all = [...path, item];
        const reversedPath = all.slice().reverse();
        if (config && (item.children === 'lazy' || item.children === 'failed')) {
            if (item.children === 'failed') {
                setMenu(menu => produce(menu, draft => {
                    const target = findNode(draft.items, all);
                    if (target) {
                        target.children = 'lazy';
                    }
                }));
            }
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
            const reject = (err?: any) => {
                if (err) {
                    console.warn(err);
                }
                setMenu(menu => produce(menu, draft => {
                    const target = findNode(draft.items, all);
                    if (target) {
                        target.children = 'failed';
                    }
                }));
            };
            fetchListAsNodes(
                typeof nextLevel === 'string' ? nextLevel : nextLevel.type,
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
            }).catch(() => {
                setPreview(rec => produce(rec, draft => {
                    draft[page.id] = 'failed';
                }));
            });
        }
    }, [curPreview, page]);

    const doPreview = (query?: string) => {
        setEditorPreview(
            fetchQueryResult(commonParamsRef.current.server, {
                uri: commonParamsRef.current.connectUri,
                sourceType: commonParamsRef.current.sourceType,
                query: query ?? queryString,
            }).then<{ name: string; value: TableData }>(res => ({
                name: 'query result',
                value: {
                    meta: res.columns.map((col, i) => ({
                        key: col,
                        dataType: null,
                        colIndex: i,
                    })),
                    columns: res.columns,
                    rows: res.rows,
                },
            })).catch(() => null)
        );
    };

    const [w, setW] = useState<string | number>('fit-content');
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const { current: container } = containerRef;
        const parent = container?.parentElement;
        if (parent) {
            const cb = (): void => {
                const { width } = parent.getBoundingClientRect();
                setW(width);
            };
            cb();
            const ro = new ResizeObserver(cb);
            ro.observe(parent);
            return () => {
                ro.disconnect();
                setW('fit-content');
            };
        }
    }, []);

    const hasEnumerableTables = Boolean(
        config?.levels.find(lvl => typeof lvl === 'string' ? lvl === 'table' : (lvl.type === 'table' && lvl.enumerable !== false))
    );

    const tables = Object.keys(preview).map<TableInfo>(pathId => {
        const node = findNodeByPathId(menu.items, pathId);
        const cols = node?.children;
        if (node && cols && Array.isArray(cols)) {
            return {
                name: pathId,
                meta: cols.map<TableColInfo>((col, i) => ({
                    key: col.key,
                    dataType: col.subtext ?? null,
                    colIndex: i,
                })),
            };
        }
        return null!;
    }).filter(Boolean);

    return (
        <QueryContainer theme={theme} ref={containerRef} style={{ width: w }}>
            <header>
                <span>{intl.get('dataSource.explorer')}</span>
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
                    primary
                    role="tab"
                    tabIndex={0}
                    aria-selected={pageIdx === EditorKey.Monaco}
                    aria-disabled={disabled}
                    onClick={() => {
                        if (!disabled) {
                            setPageIdx(EditorKey.Monaco);
                        }
                    }}
                >
                    <span>{intl.get('dataSource.query_monaco')}</span>
                </PivotHeader>
                <PivotHeader
                    primary
                    role="tab"
                    tabIndex={0}
                    aria-selected={pageIdx === EditorKey.Diagram}
                    aria-disabled={disabled}
                    onClick={() => {
                        if (!disabled) {
                            setPageIdx(EditorKey.Diagram);
                        }
                    }}
                >
                    <span>{intl.get('dataSource.query_diagram')}</span>
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
                {config && !disabled && (
                    pageIdx === EditorKey.Monaco ? (
                        <SQLEditor
                            busy={isEditorPreviewPending}
                            setQuery={q => setQueryString(q)}
                            preview={editorPreview?.value ?? null}
                            doPreview={query => {
                                setQueryString(query);
                                doPreview(query);
                            }}
                        />
                    ) : pageIdx === EditorKey.Diagram ? (
                        <DiagramEditor
                            disabled={!hasEnumerableTables}
                            busy={isEditorPreviewPending}
                            tables={tables}
                            query={queryString}
                            setQuery={q => setQueryString(q)}
                            preview={editorPreview?.value ?? null}
                            doPreview={doPreview}
                        />
                    ) : page && (
                        curPreview ? curPreview === 'failed' ? (
                            <div style={{ padding: '0.5em', color: 'red' }}>
                                {intl.get('dataSource.req_err')}
                            </div>
                        ) : <TablePreview name={page.id} submit={submit} data={curPreview} /> : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Spinner />
                            </div>
                        )
                    )
                )}
            </div>
        </QueryContainer>
    );
};


export default observer(QueryOptions);
