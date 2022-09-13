import React, { useCallback, useEffect, useMemo, useRef, useState } from  'react';
import { observer } from 'mobx-react-lite';
import { IMuteFieldBase, IRow } from '../../../../interfaces';
import { DefaultButton, Dropdown, IDropdownOption, Label, PrimaryButton, Stack, TextField, Icon, registerIcons } from 'office-ui-fabric-react';
import intl from 'react-intl-universal';
import TablePreview from './table-preview';
import { fetchTablePreview, getSourceId, listDatabases, listSchemas, listTables, pingConnector, requestSQL } from './api';
import { logDataImport } from '../../../../loggers/dataImport';
import Progress from './progress';
import prefetch from '../../../../utils/prefetch';


const StackTokens = {
    childrenGap: 20
};

export type SupportedDatabaseType = (
    | 'postgres'
    | 'clickhouse'
    | 'mysql'
    | 'kylin'
    | 'oracle'
    | 'doris'
    | 'impala'
    | 'awsathena'
    | 'redshift'
    | 'sparksql'
    | 'hive'
    | 'sqlserver'
);

const iconPathPrefix = '/assets/icons/';

const datasetOptions = ([
    {
        text: 'PostgreSQL',
        key: 'postgres',
        rule: 'postgresql://{userName}:{password}@{host}:{port}/{database}',
        hasDatabase: false,
        requiredSchema: true,
        icon: 'postgres.svg',
    },
    {
        text: 'ClickHouse',
        key: 'clickhouse',
        rule: 'clickhouse://{userName}:{password}@{host}:{port}/{database}',
        icon: 'clickhouse.svg',
    },
    {
        text: 'MySQL',
        key: 'mysql',
        icon: 'mysql.svg',
        rule: 'mysql://{userName}:{password}@{host}/{database}',
    },
    {
        text: 'Apache Kylin',
        key: 'kylin',
        rule: 'kylin://{username}:{password}@{hostname}:{port}/{project}?{param1}={value1}&{param2}={value2}',
        hasDatabase: false,
        requiredSchema: true,
        schemaEnumerable: false,
        tableEnumerable: false,
        icon: 'kylin.png'
    },
    {
        text: 'Oracle',
        key: 'oracle',
        rule: 'oracle://',
        icon: 'oracle.svg',
        hasDatabase: false,
    },
    {
        text: 'Apache Doris',
        key: 'doris',
        icon: 'doris.png',
        rule: '',
    },
    {
        text: 'Apache Impala',
        key: 'impala',
        rule: 'impala://{hostname}:{port}/{database}',
        icon: 'impala.png',
    },
    {
        text: 'Amazon Athena',
        key: 'awsathena',
        rule: 'awsathena+rest://{aws_access_key_id}:{aws_secret_access_key}@athena.{region_name}.amazonaws.com/{',
        icon: 'athena.png',
    },
    {
        text: 'Amazon Redshift',
        key: 'redshift',
        rule: 'redshift+psycopg2://<userName>:<DBPassword>@<AWS End Point>:5439/<Database Name>',
        icon: 'redshift.svg',
    },
    {
        text: 'Amazon Spark SQL',
        key: 'sparksql',
        rule: 'hive://hive@{hostname}:{port}/{database}',
        icon: 'sparksql.png',
    },
    {
        text: 'Apache Hive',
        key: 'hive',
        rule: 'hive://hive@{hostname}:{port}/{database}',
        icon: 'hive.jpg',
    },
    {
        text: 'SQL Server',
        key: 'sqlserver',
        rule: 'mssql://',
        requiredSchema: true,
        icon: 'mssql.svg',
    },
] as Array<
    & IDropdownOption
    & {
        key: SupportedDatabaseType;
        icon?: string;
        rule: string;
        /** @default true */
        hasDatabase?: boolean;
        /** @default true */
        databaseEnumerable?: boolean;
        /** @default false */
        requiredSchema?: boolean;
        /** @default true */
        schemaEnumerable?: boolean;
        /** @default true */
        hasTableList?: boolean;
        /** @default true */
        tableEnumerable?: boolean;
    }
>).sort((a, b) => a.text.localeCompare(b.text));

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

export type TableDataType = 'Int64';

export type TableLabels = {
    key: string;
    colIndex: number;
    dataType: TableDataType | string | null;
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

export type DatabaseOptions = [
    connectorReady: boolean,
    sourceType: SupportedDatabaseType,
    connectUri: string,
    sourceId: 'pending' | number | null,
    databaseList: string[] | 'input' | null,
    selectedDatabase: string | null,
    schemaList: 'pending' | 'input' | string[] | null,
    selectedSchema: string | null,
    tableList: 'pending' | 'input' | string[] | null,
    selectedTable: string | null,
    tablePreview: 'pending' | TableData<TableLabels>,
    queryString: string,
];

type Others<T extends any[]> = T extends [any, ...infer P] ? P : never;

type PartialArrayAsProgress<T extends any[], IsOrigin extends boolean> = IsOrigin extends true ? (
    T extends { [2]: any } ? (
        [T[0], T[1]] | [T[0], T[1], ...PartialArrayAsProgress<Others<Others<T>>, false>]
    ) : T
) : (
    T extends { [1]: any } ? (
        [T[0]] | [T[0], ...PartialArrayAsProgress<Others<T>, false>]
    ) : T extends { [0]: any } ? (
        T
    ) : []
);

type PartialDatabaseOptions = PartialArrayAsProgress<DatabaseOptions, true>;

const inputWidth = '180px';
const FETCH_THROTTLE_SPAN = 600;

const renderDropdownTitle: React.FC<typeof datasetOptions | undefined> = ([item]) => {
    if (!item) {
        return null;
    }

    const { icon, text, key } = item;

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-start',
            }}
        >
            <Icon
                iconName={icon ? key : 'database'}
                role="presentation"
                aria-hidden
                title={text}
                style={{
                    lineHeight: '20px',
                    width: '20px',
                    height: '20px',
                    textAlign: 'center',
                    marginInlineEnd: '8px',
                    overflow: 'hidden',
                }}
            />
            <span style={{ flexGrow: 1 }}>
                {text}
            </span>
        </div>
    );
};

const renderDropdownItem: React.FC<typeof datasetOptions[0] | undefined> = props => {
    if (!props) {
        return null;
    }

    const { icon, text, key } = props;

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-start',
            }}
        >
            <Icon
                iconName={icon ? key : 'database'}
                role="presentation"
                aria-hidden
                title={text}
                style={{
                    width: '20px',
                    height: '20px',
                    textAlign: 'center',
                    marginInlineEnd: '8px',
                    overflow: 'hidden',
                }}
            />
            <span style={{ flexGrow: 1 }}>
                {text}
            </span>
        </div>
    );
};

const DatabaseData: React.FC<DatabaseDataProps> = ({ onClose, onDataLoaded, setLoadingAnimation }) => {
    const [progress, setOptions] = useState<PartialDatabaseOptions>([false, 'mysql']);
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

    useEffect(() => {
        pingConnector().then(ok => setOptions(([_, sType]) => [ok, sType]));
    }, []);

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
            setOptions([connectorReady, sourceType, connectUri, 'pending']);
            setLoadingAnimation(true);

            const sId = await getSourceId(sourceType, connectUri);

            if (whichDatabase.hasDatabase === false) {
                setOptions(prevOpt => {
                    const [cr, sType, cUri, sIdFlag] = prevOpt;

                    if (sType === sourceType && connectUri === cUri && sIdFlag === 'pending') {
                        return [cr, sourceType, connectUri, sId, null, null];
                    }

                    return prevOpt;
                });

                setLoadingAnimation(false);

                return;
            } else if (whichDatabase.databaseEnumerable === false) {
                setOptions(prevOpt => {
                    const [cr, sType, cUri, sIdFlag] = prevOpt;

                    if (sType === sourceType && connectUri === cUri && sIdFlag === 'pending') {
                        return [cr, sourceType, connectUri, sId, 'input'];
                    }

                    return prevOpt;
                });

                setLoadingAnimation(false);

                return;
            }

            const databases = typeof sId === 'number' ? await listDatabases(sId) : null;

            if (databases) {
                setOptions(prevOpt => {
                    const [cr, sType, cUri, sIdFlag] = prevOpt;

                    if (sType === sourceType && connectUri === cUri && sIdFlag === 'pending') {
                        return [cr, sourceType, connectUri, sId, databases];
                    }

                    return prevOpt;
                });
            } else {
                setOptions(prevOpt => {

                    const [cr, sType, cUri, sIdFlag] = prevOpt;
                    if (sType === sourceType && connectUri === cUri && sIdFlag === 'pending') {
                        return [cr, sourceType, connectUri, null];
                    }
        
                    return prevOpt;
                });
            }

            setLoadingAnimation(false);
        }
    }, [sourceType, connectUri, sourceId, connectorReady, setLoadingAnimation, whichDatabase.hasDatabase, whichDatabase.databaseEnumerable]);

    // automatically fetch schema list when selected database changes
    useEffect(() => {
        if (typeof sourceId === 'number' && typeof connectUri === 'string' && databaseList !== undefined && selectedDatabase !== undefined && schemaList === undefined) {
            if (whichDatabase.requiredSchema) {
                if (whichDatabase.schemaEnumerable === false) {
                    setOptions([connectorReady, sourceType, connectUri, sourceId, databaseList, selectedDatabase, 'input']);
                    
                    return;
                }

                setOptions([connectorReady, sourceType, connectUri, sourceId, databaseList, selectedDatabase, 'pending']);
                setLoadingAnimation(true);
                
                listSchemas(sourceId, selectedDatabase).then(schemas => {
                    if (schemas) {
                        setOptions(([cr, sType, cUri, sId, dbList, curDb]) => {
                            return [cr, sType, cUri, sId, dbList, curDb, schemas] as PartialDatabaseOptions;
                        });
                    } else {
                        setOptions(([sType, cUri, sId, dbList]) => {
                            return [sType, cUri, sId, dbList] as PartialDatabaseOptions;
                        });
                    }
                }).finally(() => {
                    setLoadingAnimation(false);
                });
            } else {
                setOptions([
                    connectorReady, sourceType, connectUri, sourceId, databaseList, selectedDatabase, null, null
                ]);
            }
        }
    }, [sourceId, connectUri, sourceType, databaseList, whichDatabase, selectedDatabase, schemaList, setLoadingAnimation, connectorReady]);

    // automatically fetch table list when selected schema changes
    useEffect(() => {
        if (typeof sourceId === 'number' && typeof connectUri === 'string' && databaseList !== undefined && (schemaList === null || schemaList === 'input' || Array.isArray(schemaList)) && selectedDatabase !== undefined && selectedSchema !== undefined && tableList === undefined) {
            if (whichDatabase.hasTableList === false) {
                setOptions([
                    connectorReady,
                    sourceType,
                    connectUri,
                    sourceId,
                    databaseList,
                    selectedDatabase,
                    schemaList,
                    selectedSchema,
                    null,
                    null,
                ]);

                return;
            } else if (whichDatabase.tableEnumerable === false) {
                setOptions([
                    connectorReady,
                    sourceType,
                    connectUri,
                    sourceId,
                    databaseList,
                    selectedDatabase,
                    schemaList,
                    selectedSchema,
                    'input',
                ]);

                return;
            }

            setOptions([
                connectorReady,
                sourceType,
                connectUri,
                sourceId,
                databaseList,
                selectedDatabase,
                schemaList,
                selectedSchema,
                'pending'
            ]);
            setLoadingAnimation(true);
            
            listTables(sourceId, selectedDatabase, selectedSchema).then(tables => {
                if (tables) {
                    setOptions(([cr, sType, cUri, sId, dbList, curDb, smList, curSm]) => {
                        return [cr, sType, cUri, sId, dbList, curDb, smList, curSm, tables] as PartialDatabaseOptions;
                    });
                } else {
                    setOptions(([sType, cUri, sId, dbList, curDb, smList]) => {
                        return [sType, cUri, sId, dbList, curDb, smList] as PartialDatabaseOptions;
                    });
                }
            }).finally(() => {
                setLoadingAnimation(false);
            });
        }
    }, [sourceType, connectUri, sourceId, databaseList, selectedDatabase, schemaList, selectedSchema, setLoadingAnimation, tableList, whichDatabase.hasTableList, whichDatabase.tableEnumerable, connectorReady]);

    let lastInputTimeRef = useRef(0);
    let throttledRef = useRef<NodeJS.Timeout | null>(null);

    // automatically fetch table preview when selected table changes
    useEffect(() => {
        if (typeof sourceId === 'number' && typeof connectUri === 'string' && databaseList !== undefined && (schemaList === null || schemaList === 'input' || Array.isArray(schemaList)) && tableList !== undefined && selectedDatabase !== undefined && selectedSchema !== undefined && selectedTable !== undefined) {
            setOptions([
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
                'pending'
            ]);
            setLoadingAnimation(true);

            const autoPreview = () => {
                fetchTablePreview(sourceId, selectedDatabase, selectedSchema, selectedTable, !(whichDatabase.tableEnumerable ?? true)).then(data => {
                    if (data) {
                        setOptions(([cr, sType, cUri, sId, dbList, curDb, smList, curSm, tList, curT]) => {
                            return [
                                cr, sType, cUri, sId, dbList, curDb, smList, curSm, tList, curT, data, `select * from ${selectedTable || '<table_name>'}`
                            ] as PartialDatabaseOptions;
                        });
                    } else {
                        setOptions(([sType, cUri, sId, dbList, curDb, smList, curSm, tList]) => {
                            return [sType, cUri, sId, dbList, curDb, smList, curSm, tList] as PartialDatabaseOptions;
                        });
                    }
                }).finally(() => {
                    throttledRef.current = null;
                    setLoadingAnimation(false);
                });
            };

            if (Date.now() - lastInputTimeRef.current < FETCH_THROTTLE_SPAN) {
                if (throttledRef.current !== null) {
                    clearTimeout(throttledRef.current);
                }

                throttledRef.current = setTimeout(autoPreview, FETCH_THROTTLE_SPAN);
            } else {
                autoPreview();
            }
        }
    }, [sourceType, connectUri, sourceId, databaseList, selectedDatabase, schemaList, selectedSchema, tableList, selectedTable, setLoadingAnimation, whichDatabase.tableEnumerable, connectorReady]);

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

    const tableSelector: IDropdownOption[] | null = useMemo(() => {
        if (Array.isArray(tableList)) {
            return tableList.map<IDropdownOption>(
                tName => ({
                    text: tName,
                    key: tName,
                })
            ) ?? [];
        }

        return null;
    }, [tableList]);

    const [isQuerying, setQuerying] = useState(false);

    const query = useCallback(() => {
        if (isQuerying) {
            return;
        }

        if (typeof sourceId === 'number' && typeof selectedTable === 'string' && queryString) {
            setLoadingAnimation(true);
    
            setQuerying(true);

            requestSQL(sourceId, queryString).then(data => {
                if (data) {
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

                    onClose();
                }
            }).finally(() => {
                setQuerying(false);
                setLoadingAnimation(false);
            });
        }
    }, [isQuerying, sourceId, selectedTable, queryString, setLoadingAnimation, sourceType, selectedDatabase, selectedSchema, onDataLoaded, onClose]);

    return connectorReady ? (
        <Stack>
            <Progress
                progress={progress}
            />
            {
                typeof sourceId !== 'number' && (
                    <Stack horizontal style={{ alignItems: 'flex-end' }}>
                        <Dropdown
                            label={intl.get('dataSource.connectUri')}
                            title={intl.get('dataSource.databaseType')}
                            ariaLabel={intl.get('dataSource.databaseType')}
                            required
                            styles={{
                                dropdown: {
                                    width: '13.6em',
                                    borderRadius: '2px 0 0 2px',
                                },
                                dropdownItems: {
                                    paddingBlockStart: '6px',
                                    paddingBlockEnd: '6px',
                                    maxHeight: '20vh',
                                    overflowY: 'scroll',
                                },
                                dropdownItemSelected: {
                                    position: 'static',
                                    minHeight: '2.2em',
                                },
                                dropdownItem: {
                                    position: 'static',
                                    minHeight: '2.2em',
                                },
                            }}
                            options={datasetOptions}
                            selectedKey={sourceType}
                            onRenderOption={renderDropdownItem as (e?: IDropdownOption) => JSX.Element}
                            onRenderTitle={renderDropdownTitle as (e?: IDropdownOption[]) => JSX.Element}
                            onChange={(_, item) => {
                                if (item) {
                                    setOptions([connectorReady, item.key as SupportedDatabaseType]);
                                }
                            }}
                        />
                        <TextField
                            name={`connectUri:${whichDatabase.key}`}
                            title={intl.get('dataSource.connectUri')}
                            aria-required
                            value={connectUri ?? ''}
                            placeholder={whichDatabase.rule}
                            errorMessage={
                                sourceId === null
                                    ? intl.get('dataSource.btn.connectFailed')
                                    : undefined
                            }
                            onChange={(_, uri) => {
                                if (typeof uri === 'string') {
                                    setOptions([connectorReady, sourceType, uri]);
                                } else {
                                    setOptions([connectorReady, sourceType]);
                                }
                            }}
                            onKeyPress={e => {
                                if (e.key === 'Enter' && !(!Boolean(connectUri) || sourceId === 'pending' || sourceId === null)) {
                                    handleConnectionTest();
                                }
                            }}
                            styles={{
                                root: {
                                    position: 'relative',
                                    marginRight: '1em',
                                    flexGrow: 1,
                                    flexShrink: 1,
                                },
                                fieldGroup: {
                                    borderLeft: 'none',
                                    borderRadius: '0 4px 4px 0',
                                },
                                // 如果错误信息被插入到下方，
                                // static 定位时会导致布局被向上顶开.
                                errorMessage: {
                                    position: 'absolute',
                                    paddingBlock: '5px',
                                    paddingInlineStart: '1em',
                                    bottom: '100%',
                                },
                            }}
                        />
                        <PrimaryButton
                            text={intl.get('dataSource.btn.connect')}
                            disabled={
                                !Boolean(connectUri)
                                || sourceId === 'pending'
                                || sourceId === null
                            }
                            onClick={handleConnectionTest}
                        />
                    </Stack>
                )
            }
            {
                typeof sourceId === 'number' && (
                    <>
                        <Stack
                            tokens={StackTokens}
                            horizontal
                            style={{
                                marginBlockStart: '1.2em',
                                marginBlockEnd: '0.8em',
                                alignItems: 'center',
                            }}
                        >
                            <TextField
                                readOnly
                                value={connectUri}
                                tabIndex={-1}
                                styles={{
                                    root: {
                                        flexGrow: 1,
                                    },
                                }}
                            />
                            <DefaultButton
                                text={intl.get('dataSource.btn.reset')}
                                style={{
                                    marginInlineStart: '1em',
                                    marginInlineEnd: '0',
                                    paddingInline: '0.6em',
                                    fontSize: '70%',
                                }}
                                onClick={() => setOptions([connectorReady, sourceType])}
                            />
                        </Stack>
                        <Stack horizontal tokens={StackTokens}>
                            {
                                databaseList !== null && databaseList !== undefined && (
                                    databaseSelector ? (
                                        <Dropdown
                                            label={intl.get('dataSource.databaseName')}
                                            style={{ width: inputWidth }}
                                            options={databaseSelector}
                                            selectedKey={selectedDatabase}
                                            required
                                            onChange={(_, item) => {
                                                if (item && typeof connectUri === 'string' && databaseList) {
                                                    setOptions([
                                                        connectorReady,
                                                        sourceType,
                                                        connectUri,
                                                        sourceId,
                                                        databaseList,
                                                        item.key as string,
                                                    ]);
                                                }
                                            }}
                                        />
                                    ) : (
                                        <TextField
                                            name="databaseName"
                                            label={intl.get('dataSource.databaseName')}
                                            style={{ width: inputWidth }}
                                            value={selectedDatabase as string | undefined}
                                            required
                                            onChange={(_, key) => {
                                                lastInputTimeRef.current = Date.now();
                                                
                                                if (typeof key === 'string' && typeof connectUri === 'string' && databaseList) {
                                                    setOptions([
                                                        connectorReady,
                                                        sourceType,
                                                        connectUri,
                                                        sourceId,
                                                        databaseList,
                                                        key,
                                                    ]);
                                                }
                                            }}
                                        />
                                    )
                                )
                            }
                            {
                                schemaList !== null && schemaList !== undefined && schemaList !== 'pending' && (
                                    schemaSelector ? (
                                        <Dropdown
                                            label={intl.get('dataSource.schemaName')}
                                            style={{ width: inputWidth }}
                                            options={schemaSelector}
                                            selectedKey={selectedSchema}
                                            required
                                            onChange={(_, item) => {
                                                if (item && typeof connectUri === 'string' && databaseList !== undefined && selectedDatabase !== undefined && schemaList) {
                                                    setOptions([
                                                        connectorReady,
                                                        sourceType,
                                                        connectUri,
                                                        sourceId,
                                                        databaseList,
                                                        selectedDatabase,
                                                        schemaList,
                                                        item.key as string,
                                                    ]);
                                                }
                                            }}
                                        />
                                    ) : (
                                        <TextField
                                            name="schemaName"
                                            label={intl.get('dataSource.schemaName')}
                                            style={{ width: inputWidth }}
                                            value={selectedSchema as string | undefined}
                                            required
                                            onChange={(_, key) => {
                                                lastInputTimeRef.current = Date.now();
                                                
                                                if (typeof key === 'string' && typeof connectUri === 'string' && databaseList !== undefined && selectedDatabase !== undefined && schemaList) {
                                                    setOptions([
                                                        connectorReady,
                                                        sourceType,
                                                        connectUri,
                                                        sourceId,
                                                        databaseList,
                                                        selectedDatabase,
                                                        schemaList,
                                                        key,
                                                    ]);
                                                }
                                            }}
                                        />
                                    )
                                )
                            }
                            {
                                tableList !== null && tableList !== undefined && tableList !== 'pending' && (
                                    tableSelector ? (
                                        <Dropdown
                                            label={intl.get('dataSource.tableName')}
                                            style={{ width: inputWidth }}
                                            options={tableSelector}
                                            selectedKey={selectedTable}
                                            required
                                            onChange={(_, item) => {
                                                if (item && typeof connectUri === 'string' && databaseList !== undefined && selectedDatabase !== undefined && (schemaList === null || Array.isArray(schemaList)) && selectedSchema !== undefined && tableList) {
                                                    setOptions([
                                                        connectorReady,
                                                        sourceType,
                                                        connectUri,
                                                        sourceId,
                                                        databaseList,
                                                        selectedDatabase,
                                                        schemaList,
                                                        selectedSchema,
                                                        tableList,
                                                        item.key as string,
                                                    ]);
                                                }
                                            }}
                                        />
                                    ) : (
                                        <TextField
                                            name="tableName"
                                            label={intl.get('dataSource.tableName')}
                                            style={{ width: inputWidth }}
                                            value={selectedTable as string | undefined}
                                            required
                                            onChange={(_, key) => {
                                                lastInputTimeRef.current = Date.now();
                                                
                                                if (typeof key === 'string' && typeof connectUri === 'string' && databaseList !== undefined && selectedDatabase !== undefined && (schemaList === null || schemaList === 'input' || Array.isArray(schemaList)) && selectedSchema !== undefined && tableList) {
                                                    setOptions([
                                                        connectorReady,
                                                        sourceType,
                                                        connectUri,
                                                        sourceId,
                                                        databaseList,
                                                        selectedDatabase,
                                                        schemaList,
                                                        selectedSchema,
                                                        tableList,
                                                        key,
                                                    ]);
                                                }
                                            }}
                                        />
                                    )
                                )
                            }
                        </Stack>
                        {
                            typeof tablePreview === 'object' && (
                                <Stack tokens={StackTokens} style={{ marginBlockStart: '0.35em' }}>
                                    <Label>
                                        {intl.get('dataSource.preview')}
                                    </Label>
                                    <TablePreview
                                        data={tablePreview}
                                    />
                                    <Stack
                                        horizontal
                                        style={{
                                            alignItems: 'flex-end',
                                            marginBlockEnd: '10px',
                                        }}
                                    >
                                        <TextField
                                            name="query_string"
                                            label={intl.get('dataSource.query')}
                                            required
                                            readOnly={isQuerying}
                                            placeholder={`select * from ${selectedTable || '<table_name>'}`}
                                            value={queryString}
                                            styles={{
                                                root: {
                                                    flexGrow: 1,
                                                },
                                            }}
                                            onChange={(_, sql) => {
                                                if (typeof sql === 'string' && typeof connectUri === 'string' && databaseList !== undefined && selectedDatabase !== undefined && (schemaList === null || Array.isArray(schemaList)) && selectedSchema !== undefined && (tableList !== undefined && tableList !== 'pending') && selectedTable !== undefined && tablePreview) {
                                                    setOptions([
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
                                                        sql,
                                                    ]);
                                                }
                                            }}
                                            onKeyPress={e => {
                                                if (e.key === 'Enter') {
                                                    query();
                                                }
                                            }}
                                        />
                                        <PrimaryButton
                                            text={intl.get('dataSource.btn.query')}
                                            disabled={isQuerying || !(typeof sourceId === 'number' && typeof selectedTable === 'string' && queryString)}
                                            autoFocus
                                            onClick={query}
                                            style={{
                                                marginInline: '10px',
                                            }}
                                        />
                                    </Stack>
                                </Stack>
                            )
                        }
                    </>
                )
            }
        </Stack>
    ) : null;
};


export default observer(DatabaseData);
