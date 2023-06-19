import intl from 'react-intl-universal';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import produce from 'immer';
import { IconButton, Spinner, useTheme } from '@fluentui/react';
import type { SupportedDatabaseType, TableColInfo, TableInfo } from '../interfaces';
import databaseOptions from '../options';
import NestedList from '../components/nested-list';
import type { INestedListItem } from '../components/nested-list-item';
import useAsyncState, { AsyncDispatch } from '../../../../hooks/use-async-state';
import { notify } from '../../../../components/error';
import type { TableData } from '../main';
import { DatabaseApiOperator, DatabaseRequestPayload, fetchQueryResult } from '../service';
import TablePreview from '../tablePreview';
import SQLEditor from '../queryEditor/sqlEditor';
import DiagramEditor from '../queryEditor/diagramEditor';
import { EditorKey, fetchListAsNodes, fetchTablePreviewData, findNodeByPathId, handleBrowserItemClick, MenuType, PageType } from './utils';
import { MessageContainer, PivotHeader, PivotList, QueryBrowserHeader, QueryContainer, QueryViewBody, SpinnerContainer, SyncButton } from './components';

interface QueryOptionsProps {
    ready: boolean;
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
    credentials: Record<string, string>;
    submit: (name: string, value: TableData) => void;
    children?: any;
}

export interface QueryOptionsHandlerRef {
    reload: () => void;
}

const emptyMenu: MenuType = { title: '', items: [], isUnloaded: false };

const QueryOptions = forwardRef<QueryOptionsHandlerRef, QueryOptionsProps>(function QueryOptions ({
    ready, server, sourceType, connectUri, disabled, queryString, setQueryString, editorPreview, setEditorPreview, isEditorPreviewPending, credentials, submit, children,
}, handlerRef) {
    const theme = useTheme();
    const config = databaseOptions.find(opt => opt.key === sourceType);

    const [pages, setPages] = useState<PageType[]>([]);
    const [preview, setPreview] = useState<{ [pathId: string]: TableData | 'failed' }>({});
    const [pageIdx, setPageIdx] = useState<number | EditorKey>(EditorKey.Monaco);

    const [menu, setMenu, busy] = useAsyncState<MenuType>(emptyMenu);

    const reset = useCallback(() => {
        setMenu(emptyMenu);
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
            config.levels[1].enumerable !== false
        );

        if (firstLevel) {
            const levelType = firstLevel.type;
            setMenu(
                fetchListAsNodes(
                    levelType,
                    server,
                    {
                        sourceType,
                        uri: connectUri,
                        credentials: config.credentials === 'json' ? credentials : undefined,
                    },
                    hasNextLevel,
                ).then<typeof menu>(list => {
                    if (list) {
                        return { title: levelType, items: list, isUnloaded: false };
                    }
                    return emptyMenu;
                })
            );
        }

        reset();
    }, [config, disabled, reset, setMenu, server, sourceType, connectUri, credentials]);

    useImperativeHandle(handlerRef, () => ({
        reload,
    }));
    
    const empty = !config || disabled || (sourceType !== 'demo' && !connectUri);
    
    useEffect(() => {
        if (empty) {
            reset();
        }
    }, [empty, reset]);

    const reloadRef = useRef(reload);
    reloadRef.current = reload;

    useEffect(() => {
        if (ready) {
            reloadRef.current();
        }
    }, [ready]);

    useEffect(() => {
        reset();
    }, [sourceType, connectUri, setMenu, reset]);

    const handleItemClick = (item: INestedListItem, path: INestedListItem[]): void => {
        if (!config) {
            return;
        }
        const all = [...path, item];
        const reversedPath = all.slice().reverse();
        const commonParams: Omit<DatabaseRequestPayload<Exclude<DatabaseApiOperator, 'ping'>>, 'func'> = {
            uri: connectUri,
            sourceType,
            db: reversedPath.find(d => d.group === 'database')?.key ?? null,
            schema: reversedPath.find(d => d.group === 'schema')?.key ?? null,
            table: reversedPath.find(d => d.group === 'table')?.key ?? null,
            credentials: config.credentials === 'json' ? credentials : undefined,
        };
        handleBrowserItemClick(server, config, item, path, commonParams, setMenu, pages, setPages, setPageIdx);
    };

    const page = pages[pageIdx];
    const curPreview = page ? preview[page.id] : null;

    const commonParamsRef = useRef({ connectUri, sourceType, server });
    commonParamsRef.current = { connectUri, sourceType, server };

    useEffect(() => {
        if (config && page && page.path.at(-1)?.group === 'table' && !curPreview) {
            fetchTablePreviewData(config, page, { ...commonParamsRef.current, credentials }).then(res => {
                setPreview(rec => produce(rec, draft => {
                    draft[page.id] = res;
                }));
            }).catch(reason => {
                notify({
                    type: 'error',
                    title: 'Failed to fetch table preview',
                    content: `${reason}`,
                });
                setPreview(rec => produce(rec, draft => {
                    draft[page.id] = 'failed';
                }));
            });
        }
    }, [curPreview, page, config, credentials]);

    const doPreview = (query?: string) => {
        // TODO: requires abstraction and props check
        setEditorPreview(
            fetchQueryResult(commonParamsRef.current.server, {
                uri: commonParamsRef.current.connectUri,
                sourceType: commonParamsRef.current.sourceType,
                query: query ?? queryString,
                credentials: config?.credentials === 'json' ? credentials : undefined,
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
        config?.levels.some(lvl => lvl.type === 'table' && lvl.enumerable !== false)
    );

    const tables = useMemo(() => {
        return Object.keys(preview).map<TableInfo>(pathId => {
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
    }, [menu.items, preview]);

    if (!ready) {
        return (
            <QueryContainer theme={theme} ref={containerRef} style={{ width: w }}></QueryContainer>
        );
    }

    const previewFailed = curPreview === 'failed';
    const previewData = curPreview && curPreview !== 'failed' && curPreview;
    const previewPending = !curPreview;
    const isOpenedPage = Boolean(pageIdx >= 0 && page);

    return (
        <QueryContainer theme={theme} ref={containerRef} style={{ width: w }}>
            <QueryBrowserHeader>
                <span className="title">{intl.get('dataSource.explorer')}</span>
                <SyncButton
                    iconProps={{ iconName: 'SyncOccurence' }}
                    disabled={busy || !config || disabled}
                    busy={busy}
                    onClick={reload}
                    style={{ animation: busy ? undefined : 'none' }}
                />
            </QueryBrowserHeader>
            <PivotList theme={theme}>
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
                isUnloaded={menu.isUnloaded}
                isFailed={menu.isFailed}
                onItemClick={handleItemClick}
            />
            <QueryViewBody theme={theme}>
                {config && !disabled && (
                    <>
                        {pageIdx === EditorKey.Monaco && (
                            <SQLEditor
                                busy={isEditorPreviewPending}
                                query={queryString}
                                setQuery={q => setQueryString(q)}
                                preview={editorPreview?.value ?? null}
                                doPreview={query => {
                                    setQueryString(query);
                                    doPreview(query);
                                }}
                                items={menu.items}
                            >
                                {children}
                            </SQLEditor>
                        )}
                        {pageIdx === EditorKey.Diagram && (
                            <DiagramEditor
                                disabled={!hasEnumerableTables}
                                busy={isEditorPreviewPending}
                                tables={tables}
                                query={queryString}
                                setQuery={q => setQueryString(q)}
                                preview={editorPreview?.value ?? null}
                                doPreview={doPreview}
                            >
                                {children}
                            </DiagramEditor>
                        )}
                        {isOpenedPage && (
                            <>
                                {previewFailed && (
                                    <MessageContainer>
                                        {intl.get('dataSource.req_err')}
                                    </MessageContainer>
                                )}
                                {previewData && (
                                    <TablePreview name={page.id} submit={submit} data={previewData} />
                                )}
                                {previewPending && (
                                    <SpinnerContainer>
                                        <Spinner />
                                    </SpinnerContainer>
                                )}
                            </>
                        )}
                    </>
                )}
            </QueryViewBody>
        </QueryContainer>
    );
});


export default observer(QueryOptions);
