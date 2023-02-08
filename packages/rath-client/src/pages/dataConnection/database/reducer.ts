import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { map, Subject, switchAll, throttleTime } from 'rxjs';
import produce from 'immer';
import type { DatabaseOptions } from './type';
import datasetOptions from './config';
import { listDatabases, listSchemas, listTables, requestSQL } from './api';

const useDatabaseReducer = (setLoadingAnimation: (show: boolean) => void) => {
    const [progress, _setProgress] = useState<DatabaseOptions>({
        connectorReady: false,
        databaseType: 'clickhouse',
        connectUri: '',
        sourceId: {
            status: 'empty',
            value: NaN,
        },
        database: {
            status: 'empty',
            options: [],
        },
        schema: {
            status: 'empty',
            options: [],
        },
        table: {
            status: 'empty',
            options: [],
        },
        queryString: '',
        preview: {
            status: 'empty',
        },
    });

    const progress$ = useMemo(() => new Subject<DatabaseOptions>(), []);

    useEffect(() => {
        const subscription = progress$.pipe(throttleTime(10)).subscribe((p) => {
            _setProgress(p);
        });

        return () => subscription.unsubscribe();
    }, [progress$]);

    const ref = useRef(progress);
    ref.current = progress;
    const temp = useRef(progress);
    temp.current = progress;

    const setProgress: typeof _setProgress = useCallback(
        (p) => {
            const _p = produce(typeof p === 'function' ? p(temp.current) : p, () => {});
            temp.current = _p;
            progress$.next(_p);
        },
        [progress$]
    );

    const [connectorReady$, databaseType$, connectUri$, sourceId$, database$, schema$, table$, queryString$, preview$] = useMemo(
        () => [
            new Subject<DatabaseOptions['connectorReady']>(),
            new Subject<DatabaseOptions['databaseType']>(),
            new Subject<DatabaseOptions['connectUri']>(),
            new Subject<DatabaseOptions['sourceId']>(),
            new Subject<Promise<DatabaseOptions['database']>>(),
            new Subject<Promise<DatabaseOptions['schema']>>(),
            new Subject<Promise<DatabaseOptions['table']>>(),
            new Subject<DatabaseOptions['queryString']>(),
            new Subject<Promise<DatabaseOptions['preview']>>(),
        ],
        []
    );

    useEffect(() => {
        const subscriptions = [
            connectorReady$.subscribe((cReady) => {
                _setProgress((p) =>
                    produce(p, (draft) => {
                        draft.connectorReady = cReady;
                        draft.sourceId = {
                            status: 'empty',
                            value: NaN,
                        };
                        sourceId$.next({
                            status: 'empty',
                            value: NaN,
                        });
                    })
                );
            }),
            databaseType$.subscribe((dType) => {
                _setProgress((p) =>
                    produce(p, (draft) => {
                        draft.databaseType = dType;
                    })
                );
            }),
            connectUri$.subscribe((uri) => {
                setProgress((p) =>
                    produce(p, (draft) => {
                        draft.connectUri = uri;
                    })
                );
            }),
            sourceId$.subscribe((sId) => {
                _setProgress((p) =>
                    produce(p, (draft) => {
                        draft.sourceId = sId;
                        database$.next(
                            Promise.resolve({
                                status: 'empty',
                                options: [],
                            })
                        );
                    })
                );
                const { databaseType } = ref.current;
                if (sId.status === 'resolved' && Number.isFinite(sId.value)) {
                    // automatically fetch database list
                    const { hasDatabase = true, databaseEnumerable = true } = datasetOptions.find((which) => which.key === databaseType)!;
                    if (!hasDatabase || !databaseEnumerable) {
                        database$.next(
                            Promise.resolve({
                                status: 'resolved',
                                options: [],
                            })
                        );
                        return;
                    } else {
                        setLoadingAnimation(true);
                        const task = listDatabases(sId.value);
                        database$.next(
                            task.then((list) => {
                                if (!list) {
                                    sourceId$.next({
                                        status: 'empty',
                                        value: NaN,
                                    });
                                    return {
                                        status: 'empty',
                                        options: [],
                                    };
                                }
                                return {
                                    status: 'resolved',
                                    options: list,
                                };
                            })
                        );
                        task.finally(() => setLoadingAnimation(false));
                    }
                } else {
                    database$.next(
                        Promise.resolve({
                            status: 'empty',
                            options: [],
                        })
                    );
                }
            }),
            database$.pipe(switchAll()).subscribe((db) => {
                _setProgress((p) =>
                    produce(p, (draft) => {
                        draft.database = db;
                        schema$.next(
                            Promise.resolve({
                                status: 'empty',
                                options: [],
                            })
                        );
                    })
                );
            }),
            database$
                .pipe(
                    switchAll(),
                    map((db) => db.value)
                )
                .subscribe((dbName) => {
                    const { sourceId, databaseType } = ref.current;
                    // automatically fetch schema list when selected database changes
                    const {
                        hasDatabase = true,
                        requiredSchema = false,
                        schemaEnumerable = true,
                    } = datasetOptions.find((which) => which.key === databaseType)!;
                    if (!requiredSchema || !schemaEnumerable || sourceId.status !== 'resolved') {
                        schema$.next(
                            Promise.resolve({
                                status: 'resolved',
                                options: [],
                            })
                        );
                    } else if (!hasDatabase) {
                        schema$.next(
                            Promise.resolve({
                                status: 'pending',
                                options: [],
                            })
                        );
                        setLoadingAnimation(true);
                        const task = listSchemas(sourceId.value, null);
                        schema$.next(
                            task.then((schemas) => {
                                if (schemas) {
                                    return {
                                        status: 'resolved',
                                        options: schemas,
                                    };
                                } else {
                                    sourceId$.next({
                                        status: 'empty',
                                        value: NaN,
                                    });
                                    return {
                                        status: 'empty',
                                        options: [],
                                    };
                                }
                            })
                        );
                        task.finally(() => {
                            setLoadingAnimation(false);
                        });
                    } else if (typeof dbName === 'string') {
                        schema$.next(
                            Promise.resolve({
                                status: 'pending',
                                options: [],
                            })
                        );
                        setLoadingAnimation(true);
                        const task = listSchemas(sourceId.value, dbName);
                        schema$.next(
                            task.then((schemas) => {
                                if (schemas) {
                                    return {
                                        status: 'resolved',
                                        options: schemas,
                                    };
                                } else {
                                    sourceId$.next({
                                        status: 'empty',
                                        value: NaN,
                                    });
                                    return {
                                        status: 'empty',
                                        options: [],
                                    };
                                }
                            })
                        );
                        task.finally(() => {
                            setLoadingAnimation(false);
                        });
                    } else {
                        schema$.next(
                            Promise.resolve({
                                status: 'empty',
                                options: [],
                            })
                        );
                    }
                }),
            schema$.pipe(switchAll()).subscribe((schema) => {
                _setProgress((p) =>
                    produce(p, (draft) => {
                        draft.schema = schema;
                    })
                );
                table$.next(
                    Promise.resolve({
                        status: 'empty',
                        options: [],
                    })
                );
            }),
            schema$
                .pipe(
                    switchAll(),
                    map((s) => s.value)
                )
                .subscribe((schemaName) => {
                    const {
                        sourceId,
                        databaseType,
                        database: { value: dbName },
                    } = ref.current;
                    const {
                        hasDatabase = true,
                        requiredSchema = false,
                        hasTableList = true,
                        tableEnumerable = true,
                    } = datasetOptions.find((which) => which.key === databaseType)!;
                    // automatically fetch table list when selected schema changes
                    if (!hasTableList || !tableEnumerable || sourceId.status !== 'resolved') {
                        table$.next(
                            Promise.resolve({
                                status: 'resolved',
                                options: [],
                            })
                        );
                    } else if ((hasDatabase ? typeof dbName === 'string' : true) && (requiredSchema ? typeof schemaName === 'string' : true)) {
                        table$.next(
                            Promise.resolve({
                                status: 'pending',
                                options: [],
                            })
                        );
                        setLoadingAnimation(true);
                        const task = listTables(sourceId.value, dbName ?? null, schemaName ?? null);
                        table$.next(
                            task.then((tables) => {
                                if (tables) {
                                    return {
                                        status: 'resolved',
                                        options: tables,
                                    };
                                } else {
                                    sourceId$.next({
                                        status: 'empty',
                                        value: NaN,
                                    });
                                    return {
                                        status: 'empty',
                                        options: [],
                                    };
                                }
                            })
                        );
                        task.finally(() => {
                            setLoadingAnimation(false);
                        });
                    } else {
                        table$.next(
                            Promise.resolve({
                                status: 'empty',
                                options: [],
                            })
                        );
                    }
                }),
            table$.pipe(switchAll()).subscribe((table) => {
                _setProgress((p) =>
                    produce(p, (draft) => {
                        draft.table = table;
                    })
                );
                preview$.next(
                    Promise.resolve({
                        status: 'empty',
                    })
                );
                queryString$.next('');
            }),
            queryString$.subscribe((sql) => {
                setProgress((p) =>
                    produce(p, (draft) => {
                        draft.queryString = sql;
                    })
                );
                preview$.next(
                    Promise.resolve({
                        status: 'empty',
                    })
                );
            }),
            preview$.pipe(switchAll()).subscribe((preview) => {
                _setProgress((p) =>
                    produce(p, (draft) => {
                        draft.preview = preview;
                    })
                );
            }),
        ];

        return () => {
            subscriptions.forEach((sbs) => sbs.unsubscribe());
        };
    }, [
        connectorReady$,
        databaseType$,
        connectUri$,
        sourceId$,
        database$,
        schema$,
        table$,
        preview$,
        queryString$,
        setLoadingAnimation,
        setProgress,
    ]);

    const actions = useMemo(
        () => ({
            setConnectorStatus: (status: DatabaseOptions['connectorReady']) => {
                connectorReady$.next(status);
            },
            setDatabaseType: (dbType: DatabaseOptions['databaseType']) => {
                databaseType$.next(dbType);
            },
            setConnectUri: (uri: DatabaseOptions['connectUri']) => {
                connectUri$.next(uri);
            },
            setSourceId: (sourceId: DatabaseOptions['sourceId']) => {
                sourceId$.next(sourceId);
            },
            setDatabase: (database: DatabaseOptions['database']['options'][0]) => {
                const db = produce(ref.current.database, (draft) => {
                    draft.value = database;
                });
                database$.next(Promise.resolve(db));
            },
            setSchemaList: (schema: DatabaseOptions['schema']) => {
                schema$.next(Promise.resolve(schema));
            },
            setSchema: (schema: DatabaseOptions['schema']['options'][0]) => {
                schema$.next(
                    Promise.resolve(
                        produce(ref.current.schema, (draft) => {
                            draft.value = schema;
                        })
                    )
                );
            },
            setTableList: (table: DatabaseOptions['table']) => {
                table$.next(Promise.resolve(table));
            },
            setQueryString: (sql: DatabaseOptions['queryString']) => {
                queryString$.next(sql);
            },
            genPreview: (sql?: DatabaseOptions['queryString']) => {
                const { sourceId, queryString } = ref.current;
                const content = sql ?? queryString;
                if (!content || sourceId.status !== 'resolved') {
                    return;
                }
                preview$.next(
                    Promise.resolve({
                        status: 'empty',
                    })
                );
                setLoadingAnimation(true);
                const task = requestSQL(sourceId.value, content);
                preview$.next(
                    task.then((data) => {
                        if (data) {
                            return {
                                status: 'resolved',
                                value: data,
                            };
                        }
                        return {
                            status: 'empty',
                        };
                    })
                );
                task.finally(() => {
                    setLoadingAnimation(false);
                });
            },
        }),
        [connectorReady$, databaseType$, connectUri$, sourceId$, database$, schema$, table$, preview$, queryString$, setLoadingAnimation]
    );

    return {
        progress,
        actions,
    };
};

export default useDatabaseReducer;
