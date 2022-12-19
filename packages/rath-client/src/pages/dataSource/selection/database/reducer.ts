import { useEffect, useMemo, useRef, useState } from 'react';
import produce from 'immer';
import useAsyncState from '../../../../hooks/use-async-state';
import type { DatabaseOptions } from './type';
import datasetOptions from './config';
import { listDatabases, listSchemas, listTables, requestSQL } from './api';


const useDatabaseReducer = (setLoadingAnimation: (show: boolean) => void) => {
    const setLoadingAnimationRef = useRef(setLoadingAnimation);
    setLoadingAnimationRef.current = setLoadingAnimation;

    const [connectorReady, setConnectorReady] = useState<DatabaseOptions['connectorReady']>(false);
    const [databaseType, setDatabaseType] = useState<DatabaseOptions['databaseType']>('clickhouse');
    const [connectUri, setConnectUri] = useState<DatabaseOptions['connectUri']>('');
    const [sourceId, setSourceId] = useState<DatabaseOptions['sourceId']>({ status: 'empty', value: NaN });
    const [database, setDatabase] = useAsyncState<DatabaseOptions['database']>({ status: 'empty', options: [] });
    const [schema, setSchema] = useAsyncState<DatabaseOptions['schema']>({ status: 'empty', options: [] });
    const [table, setTable] = useAsyncState<DatabaseOptions['table']>({ status: 'empty', options: [] });
    const [queryString, setQueryString] = useState<DatabaseOptions['queryString']>('');
    const [preview, setPreview] = useAsyncState<DatabaseOptions['preview']>({ status: 'empty' });
    
    const ref = useRef<DatabaseOptions>(undefined!); // undefined but defined, magic oh yeah
    ref.current = { connectorReady, databaseType, connectUri, sourceId, database, schema, table, queryString, preview };

    useEffect(() => {
        setSourceId({ status: 'empty', value: NaN });
    }, [connectorReady]);

    useEffect(() => {
        setDatabase({ status: 'empty', options: [] });
        const { databaseType } = ref.current;
        if (sourceId.status === 'resolved' && Number.isFinite(sourceId.value)) {
            // automatically fetch database list
            const { hasDatabase = true, databaseEnumerable = true } = datasetOptions.find(which => which.key === databaseType)!;
            if (!hasDatabase || !databaseEnumerable) {
                setDatabase({
                    status: 'resolved',
                    options: [],
                });
                return;
            } else {
                setLoadingAnimationRef.current(true);
                const task = listDatabases(sourceId.value);
                setDatabase(task.then(list => {
                    if (!list) {
                        setSourceId({
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
                }));
                task.finally(() => setLoadingAnimationRef.current(false));
            }
        } else {
            setDatabase({
                status: 'empty',
                options: [],
            });
        }
    }, [sourceId, setDatabase]);

    useEffect(() => {
        setSchema({
            status: 'empty',
            options: [],
        });
        const { value: dbName } = database;
        const { sourceId, databaseType } = ref.current;
        // automatically fetch schema list when selected database changes
        const { hasDatabase = true, requiredSchema = false, schemaEnumerable = true } = datasetOptions.find(which => which.key === databaseType)!;
        if (!requiredSchema || !schemaEnumerable || sourceId.status !== 'resolved') {
            setSchema({
                status: 'resolved',
                options: [],
            });
        } else if (!hasDatabase) {
            setSchema({
                status: 'pending',
                options: [],
            });
            setLoadingAnimationRef.current(true);
            const task = listSchemas(sourceId.value, null);
            setSchema(task.then(schemas => {
                if (schemas) {
                    return {
                        status: 'resolved',
                        options: schemas,
                    };
                } else {
                    setSourceId({
                        status: 'empty',
                        value: NaN,
                    });
                    return {
                        status: 'empty',
                        options: [],
                    };
                }
            }));
            task.finally(() => {
                setLoadingAnimationRef.current(false);
            });
        } else if (typeof dbName === 'string') {
            setSchema({
                status: 'pending',
                options: [],
            });
            setLoadingAnimationRef.current(true);
            const task = listSchemas(sourceId.value, dbName);
            setSchema(task.then(schemas => {
                if (schemas) {
                    return {
                        status: 'resolved',
                        options: schemas,
                    };
                } else {
                    setSourceId({
                        status: 'empty',
                        value: NaN,
                    });
                    return {
                        status: 'empty',
                        options: [],
                    };
                }
            }));
            task.finally(() => {
                setLoadingAnimationRef.current(false);
            });
        } else {
            setSchema({
                status: 'empty',
                options: [],
            });
        }
    }, [database, setSchema]);

    useEffect(() => {
        setTable({
            status: 'empty',
            options: [],
        });
        const { value: schemaName } = schema;
        const { sourceId, databaseType, database: { value: dbName } } = ref.current;
        const { hasDatabase = true, requiredSchema = false, hasTableList = true, tableEnumerable = true } = datasetOptions.find(which => which.key === databaseType)!;
        // automatically fetch table list when selected schema changes
        if (!hasTableList || !tableEnumerable || sourceId.status !== 'resolved') {
            setTable({
                status: 'resolved',
                options: [],
            });
        } else if ((hasDatabase ? typeof dbName === 'string' : true) && (requiredSchema ? typeof schemaName === 'string' : true)) {
            setTable({
                status: 'pending',
                options: [],
            });
            setLoadingAnimationRef.current(true);
            const task = listTables(sourceId.value, dbName ?? null, schemaName ?? null);
            setTable(task.then(tables => {
                if (tables) {
                    return {
                        status: 'resolved',
                        options: tables,
                    };
                } else {
                    setSourceId({
                        status: 'empty',
                        value: NaN,
                    });
                    return {
                        status: 'empty',
                        options: [],
                    };
                }
            }));
            task.finally(() => {
                setLoadingAnimationRef.current(false);
            });
        } else {
            setTable({
                status: 'empty',
                options: [],
            });
        }
    }, [schema, setTable]);

    useEffect(() => {
        setQueryString('');
    }, [table]);

    useEffect(() => {
        setPreview({ status: 'empty' });
    }, [queryString, setPreview]);

    const actions = useMemo(() => ({
        setConnectorStatus: (status: DatabaseOptions['connectorReady']) => {
            setConnectorReady(status);
        },
        setDatabaseType: (dbType: DatabaseOptions['databaseType']) => {
            setDatabaseType(dbType);
        },
        setConnectUri: (uri: DatabaseOptions['connectUri']) => {
            setConnectUri(uri);
        },
        setSourceId: (sourceId: DatabaseOptions['sourceId']) => {
            setSourceId(sourceId);
        },
        setDatabase: (database: DatabaseOptions['database']['options'][0]) => {
            setDatabase(produce(ref.current.database, draft => {
                draft.value = database;
            }));
        },
        setSchema: (schema: DatabaseOptions['schema']['options'][0]) => {
            setSchema(produce(ref.current.schema, draft => {
                draft.value = schema;
            }));
        },
        setQueryString: (sql: DatabaseOptions['queryString']) => {
            setQueryString(sql);
        },
        genPreview: (sql?: DatabaseOptions['queryString']) => {
            const { sourceId, queryString } = ref.current;
            const content = sql ?? queryString;
            if (!content || sourceId.status !== 'resolved') {
                return;
            }
            setPreview({ status: 'empty' });
            setLoadingAnimationRef.current(true);
            const task = requestSQL(sourceId.value, content);
            setPreview(task.then(data => {
                if (data) {
                    return {
                        status: 'resolved',
                        value: data,
                    };
                }
                return { status: 'empty' };
            }));
            task.finally(() => {
                setLoadingAnimationRef.current(false);
            });
        },
    }), [setDatabase, setPreview, setSchema]);
    
    return {
        progress: ref.current,
        actions,
    };
};


export default useDatabaseReducer;
