import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { IDropdownOption, Stack, registerIcons } from '@fluentui/react';
import type { IMuteFieldBase, IRow } from '../../../../interfaces';
import { logDataImport } from '../../../../loggers/dataImport';
import prefetch from '../../../../utils/prefetch';
import { notify } from '../../../../components/error';
import Progress from './progress';
import datasetOptions from './config';
import ConnectForm, { ConnectFormReadonly } from './connect-form';
import DropdownOrInput from './dropdown-or-input';
import useDatabaseReducer from './reducer';
import { fetchTablePreview, getSourceId, listDatabases, listSchemas, listTables, pingConnector, requestSQL } from './api';
import CustomConfig from './customConfig';
import QueryEditor from './query-editor';
import TablePreview from './table-preview';
import { transformRawDataService } from '../../utils';

export const StackTokens = {
    childrenGap: 20,
};

const iconPathPrefix = '/assets/icons/';

registerIcons({
    icons: Object.fromEntries(
        datasetOptions.map<[string, JSX.Element]>(opt => [
            opt.key,
            opt.icon ? (
                <img
                    role="presentation"
                    aria-hidden
                    src={`${iconPathPrefix}${opt.icon}`}
                    alt={opt.text}
                    style={{
                        width: '100%',
                        height: '100%',
                    }}
                />
            ) : (<></>)
        ])
    ),
});

export type TableLabels = {
    key: string;
    colIndex: number;
    dataType: string | null;
}[];

type TableRowItem<TL extends TableLabels> = {
    [key in keyof TL]: any
};

export interface TableData<TL extends TableLabels = TableLabels> {
    columns: TL;
    rows: TableRowItem<TL>[];
}

interface DatabaseDataProps {
    onClose: () => void;
    onDataLoaded: (fields: IMuteFieldBase[], dataSource: IRow[]) => void;
    setLoadingAnimation: (on: boolean) => void;
}

export const inputWidth = '180px';
const FETCH_THROTTLE_SPAN = 600;

const DatabaseData: React.FC<DatabaseDataProps> = ({ onClose, onDataLoaded, setLoadingAnimation }) => {
    const [progress, dispatch] = useDatabaseReducer();
    const [loading, setLoading] = useState<boolean>(false);

    const [
        connectorReady,
        sourceType,
        connectUri,
        sourceId,
        databaseList,
        selectedDatabase,
        schemaList,
        selectedSchema,
        tableList,
        selectedTable,
        tablePreview,
        queryString,
    ] = progress;

    const ping = useCallback(async () => {
        try {
            setLoading(true)
            const ok = await pingConnector();
            if (ok) {
                dispatch({
                    type: 'ENABLE_CONNECTOR',
                    payload: undefined
                })
            }
        } catch (error) {
            notify({
                type: 'error',
                title: 'ping connector error',
                content: `${error}`
            })
        } finally {
            setLoading(false);
        }
    }, [dispatch])

    useEffect(() => {
        ping();
    }, [ping]);

    // prefetch icons
    useEffect(() => {
        datasetOptions.forEach(({ icon }) => {
            if (icon) {
                prefetch(`${iconPathPrefix}${icon}`);
            }
        });
    }, []);

    const whichDatabase = datasetOptions.find(which => which.key === sourceType)!;

    useEffect(() => {
        setLoadingAnimation(false);

        return () => setLoadingAnimation(false);
    }, [setLoadingAnimation]);

    const handleConnectionTest = useCallback(async () => {
        if (sourceType && connectUri && sourceId === undefined) {
            dispatch({
                type: 'SET_SOURCE_ID_AND_DATABASE_LIST',
                payload: {
                    sourceId: 'pending'
                }
            });
            setLoadingAnimation(true);

            const sId = await getSourceId(sourceType, connectUri);

            if (whichDatabase.hasDatabase === false) {
                dispatch({
                    type: 'SET_SOURCE_ID_AND_DATABASE_LIST',
                    payload: {
                        sourceId: sId,
                        dbList: null
                    }
                });

                setLoadingAnimation(false);

                return;
            } else if (whichDatabase.databaseEnumerable === false) {
                dispatch({
                    type: 'SET_SOURCE_ID_AND_DATABASE_LIST',
                    payload: {
                        sourceId: sId,
                        dbList: 'input'
                    }
                });

                setLoadingAnimation(false);

                return;
            }

            const databases = typeof sId === 'number' ? await listDatabases(sId) : null;

            if (databases) {
                dispatch({
                    type: 'SET_SOURCE_ID_AND_DATABASE_LIST',
                    payload: {
                        sourceId: sId,
                        dbList: databases
                    }
                });
            } else {
                dispatch({
                    type: 'SET_SOURCE_ID_AND_DATABASE_LIST',
                    payload: {
                        sourceId: null
                    }
                });
            }

            setLoadingAnimation(false);
        }
    }, [sourceType, connectUri, sourceId, dispatch, setLoadingAnimation, whichDatabase.hasDatabase, whichDatabase.databaseEnumerable]);

    // automatically fetch schema list when selected database changes
    useEffect(() => {
        if (typeof sourceId === 'number' && typeof connectUri === 'string' && databaseList !== undefined && selectedDatabase !== undefined && schemaList === undefined) {
            if (whichDatabase.requiredSchema) {
                if (whichDatabase.schemaEnumerable === false) {
                    dispatch({
                        type: 'SET_SCHEMA_LIST',
                        payload: {
                            sList: 'input'
                        }
                    });

                    return;
                }

                dispatch({
                    type: 'SET_SCHEMA_LIST',
                    payload: {
                        sList: 'pending'
                    }
                });

                setLoadingAnimation(true);

                listSchemas(sourceId, selectedDatabase).then(schemas => {
                    if (schemas) {
                        dispatch({
                            type: 'SET_SCHEMA_LIST',
                            payload: {
                                sList: schemas
                            }
                        });
                    } else {
                        dispatch({
                            type: 'SET_SOURCE_ID_AND_DATABASE_LIST',
                            payload: {
                                sourceId,
                                dbList: databaseList
                            }
                        });
                    }
                }).finally(() => {
                    setLoadingAnimation(false);
                });
            } else {
                dispatch({
                    type: 'SET_SCHEMA_LIST',
                    payload: {
                        sList: null
                    }
                });
            }
        }
    }, [sourceId, connectUri, sourceType, databaseList, whichDatabase, selectedDatabase, schemaList, setLoadingAnimation, connectorReady, dispatch]);

    // automatically fetch table list when selected schema changes
    useEffect(() => {
        if (typeof sourceId === 'number' && typeof connectUri === 'string' && databaseList !== undefined && (schemaList === null || schemaList === 'input' || Array.isArray(schemaList)) && selectedDatabase !== undefined && selectedSchema !== undefined && tableList === undefined) {
            if (whichDatabase.hasTableList === false) {
                dispatch({
                    type: 'SET_TABLE_LIST',
                    payload: {
                        tList: null
                    }
                });

                return;
            } else if (whichDatabase.tableEnumerable === false) {
                dispatch({
                    type: 'SET_TABLE_LIST',
                    payload: {
                        tList: 'input'
                    }
                });

                return;
            }

            dispatch({
                type: 'SET_TABLE_LIST',
                payload: {
                    tList: 'pending'
                }
            });

            setLoadingAnimation(true);

            listTables(sourceId, selectedDatabase, selectedSchema).then(tables => {
                if (tables) {
                    dispatch({
                        type: 'SET_TABLE_LIST',
                        payload: {
                            tList: tables
                        }
                    });
                } else {
                    dispatch({
                        type: 'SET_SCHEMA_LIST',
                        payload: {
                            sList: schemaList
                        }
                    });
                }
            }).finally(() => {
                setLoadingAnimation(false);
            });
        }
    }, [sourceType, connectUri, sourceId, databaseList, selectedDatabase, schemaList, selectedSchema, setLoadingAnimation, tableList, whichDatabase.hasTableList, whichDatabase.tableEnumerable, connectorReady, dispatch]);

    let lastInputTimeRef = useRef(0);
    let throttledRef = useRef<NodeJS.Timeout | null>(null);
    const updateInputTime = useCallback(() => {
        lastInputTimeRef.current = Date.now();
    }, []);

    // automatically fetch table preview when selected table changes
    useEffect(() => {
        if (typeof sourceId === 'number' && typeof connectUri === 'string' && databaseList !== undefined && (schemaList === null || schemaList === 'input' || Array.isArray(schemaList)) && tableList !== undefined && selectedDatabase !== undefined && selectedSchema !== undefined && selectedTable !== undefined) {
            dispatch({
                type: 'SET_PREVIEW',
                payload: {
                    preview: 'pending'
                }
            });
            setLoadingAnimation(true);

            if (throttledRef.current !== null) {
                clearTimeout(throttledRef.current);
                throttledRef.current = null;
            }

            const autoPreview = () => {
                const flag = throttledRef.current;

                fetchTablePreview(sourceId, selectedDatabase, selectedSchema, selectedTable, !(whichDatabase.tableEnumerable ?? true)).then(data => {
                    if (flag !== throttledRef.current) {
                        return;
                    }

                    if (data) {
                        dispatch({
                            type: 'SET_PREVIEW',
                            payload: {
                                preview: data
                            }
                        });
                        dispatch({
                            type: 'SET_SQL',
                            payload: {
                                sql: [`select * from ${selectedTable || '<table_name>'}`],
                            }
                        });
                    } else {
                        dispatch({
                            type: 'SET_TABLE',
                            payload: {
                                tName: selectedTable!
                            }
                        });
                    }
                }).finally(() => {
                    throttledRef.current = null;
                    setLoadingAnimation(false);
                });
            };

            const operationOffset = FETCH_THROTTLE_SPAN - (Date.now() - lastInputTimeRef.current);

            if (operationOffset > 0) {
                throttledRef.current = setTimeout(autoPreview, operationOffset);
            } else {
                autoPreview();
            }
        }
    }, [sourceType, connectUri, sourceId, databaseList, selectedDatabase, schemaList, selectedSchema, tableList, selectedTable, setLoadingAnimation, whichDatabase.tableEnumerable, connectorReady, dispatch]);

    const databaseSelector: IDropdownOption[] | null = useMemo(() => {
        return databaseList === 'input' ? null : databaseList?.map<IDropdownOption>(
            dbName => ({
                text: dbName,
                key: dbName,
            })
        ) ?? null;
    }, [databaseList]);

    const schemaSelector: IDropdownOption[] | null = useMemo(() => {
        if (whichDatabase.requiredSchema && Array.isArray(schemaList)) {
            return schemaList.map<IDropdownOption>(
                dbName => ({
                    text: dbName,
                    key: dbName,
                })
            ) ?? [];
        }

        return null;
    }, [whichDatabase, schemaList]);

    const [isQuerying, setQuerying] = useState(false);

    const [previewList, setPreviewList] = useState<TableData[]>([]);

    const query = useCallback(() => {
        if (isQuerying) {
            return;
        }

        if (typeof sourceId === 'number' && queryString) {
            setLoadingAnimation(true);

            setQuerying(true);

            queryString.forEach(sql => {
                requestSQL(sourceId, sql).then(data => {
                    if (data) {
                        setPreviewList(list => [...list, data]);
                    }
                }).finally(() => {
                    setQuerying(false);
                    setLoadingAnimation(false);
                });
            });
        }
    }, [isQuerying, sourceId, selectedTable, queryString, setLoadingAnimation, sourceType, selectedDatabase, selectedSchema, onDataLoaded, onClose]);

    useEffect(() => {
        setPreviewList([]);
    }, [queryString]);
    
    const submit = async () => {
        for await (const { rows, columns } of previewList) {
            const data = await transformRawDataService(
                rows.map(
                    row => Object.fromEntries(
                        row.map<[string, any]>((val, colIdx) => [columns?.[colIdx]?.key ?? `${colIdx}`, val])
                    )
                )
            );
            const { dataSource, fields } = data;

            logDataImport({
                dataType: `Database/${sourceType}`,
                name: [selectedDatabase, selectedSchema, selectedTable].filter(
                    Boolean
                ).join('.'),
                fields,
                dataSource: [],
                size: dataSource.length,
            });

            onDataLoaded(fields, dataSource);
        }
        onClose();
    };

    return <div>
        <CustomConfig ping={ping} loading={loading} />
        {
            connectorReady && <Stack>
                <Progress
                    progress={progress}
                />
                {
                    typeof sourceId !== 'number' && (
                        <ConnectForm
                            sourceType={sourceType}
                            setSourceType={sType => dispatch({
                                type: 'SET_SOURCE_TYPE',
                                payload: {
                                    sourceType: sType
                                }
                            })}
                            whichDatabase={whichDatabase}
                            sourceId={sourceId}
                            connectUri={connectUri}
                            setConnectUri={uri => dispatch({
                                type: 'SET_CONNECT_URI',
                                payload: {
                                    uri
                                }
                            })}
                            handleConnectionTest={handleConnectionTest}
                        />
                    )
                }
                {
                    typeof sourceId === 'number' && (
                        <>
                            <ConnectFormReadonly
                                connectUri={connectUri!}
                                resetConnectUri={() => dispatch({
                                    type: 'SET_SOURCE_TYPE',
                                    payload: {
                                        sourceType,
                                    }
                                })}
                            />
                            <Stack horizontal tokens={StackTokens} style={{ flexDirection: 'column' }}>
                                {
                                    tableList !== null && tableList !== undefined && tableList !== 'pending' ? (
                                        <>
                                            <QueryEditor
                                                tables={tableList}
                                                query={queryString ?? []}
                                                setQuery={sql => {
                                                    if (typeof connectUri === 'string' && databaseList !== undefined && selectedDatabase !== undefined && (schemaList === null || Array.isArray(schemaList)) && selectedSchema !== undefined && tableList !== undefined && selectedTable !== undefined && tablePreview) {
                                                        dispatch({
                                                            type: 'SET_SQL',
                                                            payload: {
                                                                sql
                                                            }
                                                        });
                                                    }
                                                }}
                                            />
                                            <div>
                                                <button
                                                    onClick={query}
                                                >
                                                    preview
                                                </button>
                                            </div>
                                            {previewList.length > 0 && (
                                                <div>
                                                    {previewList.map((pv, i) => (
                                                        <TablePreview
                                                            key={i}
                                                            data={pv}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                            {previewList.length > 0 && (
                                                <div>
                                                    <button
                                                        onClick={submit}
                                                    >
                                                        submit
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            {
                                                databaseList !== null && databaseList !== undefined && (
                                                    <DropdownOrInput
                                                        name="dataSource.databaseName"
                                                        options={databaseSelector}
                                                        value={selectedDatabase}
                                                        setValue={val => {
                                                            if (typeof connectUri === 'string' && databaseList) {
                                                                dispatch({
                                                                    type: 'SET_DATABASE',
                                                                    payload: {
                                                                        dbName: val
                                                                    }
                                                                });
                                                            }
                                                        }}
                                                        updateInputTime={updateInputTime}
                                                    />
                                                )
                                            }
                                            {
                                                schemaList !== null && schemaList !== undefined && schemaList !== 'pending' && (
                                                    <DropdownOrInput
                                                        name="dataSource.schemaName"
                                                        options={schemaSelector}
                                                        value={selectedSchema}
                                                        setValue={val => {
                                                            if (typeof connectUri === 'string' && databaseList !== undefined && selectedDatabase !== undefined && schemaList) {
                                                                dispatch({
                                                                    type: 'SET_SCHEMA',
                                                                    payload: {
                                                                        sName: val
                                                                    }
                                                                });
                                                            }
                                                        }}
                                                        updateInputTime={updateInputTime}
                                                    />
                                                )
                                            }
                                        </>
                                    )
                                }
                            </Stack>
                        </>
                    )
                }
            </Stack>
        }
    </div>
};


export default observer(DatabaseData);
