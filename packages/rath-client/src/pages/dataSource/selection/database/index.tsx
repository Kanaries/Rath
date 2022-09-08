import React, { useCallback, useEffect, useMemo, useState } from  'react';
import { observer } from 'mobx-react-lite';
import { IMuteFieldBase, IRow } from '../../../../interfaces';
import { DefaultButton, Dropdown, IDropdownOption, Label, PrimaryButton, Stack, TextField } from 'office-ui-fabric-react';
import intl from 'react-intl-universal';
import TablePreview from './table-preview';
import { fetchTablePreview, getSourceId, listDatabases, listSchemas, listTables, requestSQL } from './api';
import { logDataImport } from '../../../../loggers/dataImport';


const StackTokens = {
    childrenGap: 20
};

export type SupportedDatabaseType = (
    | 'postgres'
    | 'clickhouse'
    | 'mysql'
);

const datasetOptions = ([
    {
        text: 'PostgreSQL',
        key: 'postgres',
        rule: 'postgresql://{userName}:{password}@{host}:{port}/{database}',
        hasDataset: false,
        requiredSchema: true,
    },
    {
        text: 'ClickHouse',
        key: 'clickhouse',
        rule: 'clickhouse://{userName}:{password}@{host}:{port}/{database}',
    },
    {
        text: 'MySQL',
        key: 'mysql',
        rule: 'mysql://{userName}:{password}@{host}/{database}',
    },
] as Array<
    & IDropdownOption
    & {
        key: SupportedDatabaseType;
        rule: string;
        hasDataset?: boolean;
        requiredSchema?: boolean;
    }
>).sort((a, b) => a.text.localeCompare(b.text));

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

type DatabaseOptions = [
    sourceType: SupportedDatabaseType,
    connectUri: string,
    sourceId: 'pending' | number | null,
    databaseList: string[] | null,
    selectedDatabase: string | null,
    schemaList: 'pending' | string[] | null,
    selectedSchema: string | null,
    tableList: 'pending' | string[],
    selectedTable: string,
    tablePreview: 'pending' | TableData<TableLabels>,
    queryString: string,
];

type Others<T extends any[]> = T extends [any, ...infer P] ? P : never;

type PartialArrayAsProgress<T extends any[]> = T extends { [1]: any } ? (
    [T[0]] | [T[0], ...PartialArrayAsProgress<Others<T>>]
) : T extends { [0]: any } ? (
    T
) : [];

type PartialDatabaseOptions = PartialArrayAsProgress<DatabaseOptions>;

const inputWidth = '180px';

const DatabaseData: React.FC<DatabaseDataProps> = ({ onClose, onDataLoaded, setLoadingAnimation }) => {
    const [
        [
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
        ],
        setOptions
    ] = useState<PartialDatabaseOptions>(['mysql']);

    const whichDataset = datasetOptions.find(which => which.key === sourceType) ?? null;

    useEffect(() => {
        setLoadingAnimation(false);

        return () => setLoadingAnimation(false);
    }, [setLoadingAnimation]);

    const uriPrefix = /^[a-z]+:\/{2}/i.exec(whichDataset?.rule ?? '')?.[0];

    const handleConnectionTest = useCallback(async () => {
        if (sourceType && connectUri && sourceId === undefined) {
            setOptions([sourceType, connectUri, 'pending']);
            setLoadingAnimation(true);

            const sId = await getSourceId(sourceType, connectUri);

            if (whichDataset?.hasDataset === false) {
                setOptions(prevOpt => {
                    const [sType, cUri, sIdFlag] = prevOpt;

                    if (sType === sourceType && connectUri === cUri && sIdFlag === 'pending') {
                        return [sourceType, connectUri, sId, null, null];
                    }

                    return prevOpt;
                });

                setLoadingAnimation(false);

                return;
            }

            const databases = typeof sId === 'number' ? await listDatabases(sId) : null;

            if (databases) {
                setOptions(prevOpt => {
                    const [sType, cUri, sIdFlag] = prevOpt;

                    if (sType === sourceType && connectUri === cUri && sIdFlag === 'pending') {
                        return [sourceType, connectUri, sId, databases];
                    }

                    return prevOpt;
                });
            } else {
                setOptions(prevOpt => {

                    const [sType, cUri, sIdFlag] = prevOpt;
                    if (sType === sourceType && connectUri === cUri && sIdFlag === 'pending') {
                        return [sourceType, connectUri, null];
                    }
        
                    return prevOpt;
                });
            }

            setLoadingAnimation(false);
        }
    }, [sourceType, connectUri, sourceId, setLoadingAnimation, whichDataset?.hasDataset]);

    // automatically fetch schema list when selected database changes
    useEffect(() => {
        if (typeof sourceId === 'number' && typeof connectUri === 'string' && databaseList !== undefined && whichDataset && selectedDatabase !== undefined && schemaList === undefined) {
            if (whichDataset.requiredSchema) {
                setOptions([sourceType, connectUri, sourceId, databaseList, selectedDatabase, 'pending']);
                setLoadingAnimation(true);
                
                listSchemas(sourceId, selectedDatabase).then(schemas => {
                    if (schemas) {
                        setOptions(([sType, cUri, sId, dbList, curDb]) => {
                            return [sType, cUri, sId, dbList, curDb, schemas] as PartialDatabaseOptions;
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
                    sourceType, connectUri, sourceId, databaseList, selectedDatabase, null, null
                ]);
            }
        }
    }, [sourceId, connectUri, sourceType, databaseList, whichDataset, selectedDatabase, schemaList, setLoadingAnimation]);

    // automatically fetch table list when selected schema changes
    useEffect(() => {
        if (typeof sourceId === 'number' && typeof connectUri === 'string' && databaseList !== undefined && (schemaList === null || Array.isArray(schemaList)) && selectedDatabase !== undefined && selectedSchema !== undefined && tableList === undefined) {
            setOptions([
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
                    setOptions(([sType, cUri, sId, dbList, curDb, smList, curSm]) => {
                        return [sType, cUri, sId, dbList, curDb, smList, curSm, tables] as PartialDatabaseOptions;
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
    }, [sourceType, connectUri, sourceId, databaseList, selectedDatabase, schemaList, selectedSchema, setLoadingAnimation, tableList]);

    // automatically fetch table preview when selected table changes
    useEffect(() => {
        if (typeof sourceId === 'number' && typeof connectUri === 'string' && databaseList !== undefined && (schemaList === null || Array.isArray(schemaList)) && tableList && selectedDatabase !== undefined && selectedSchema !== undefined && typeof selectedTable === 'string') {
            setOptions([
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

            fetchTablePreview(sourceId, selectedDatabase, selectedSchema, selectedTable).then(data => {
                if (data) {
                    setOptions(([sType, cUri, sId, dbList, curDb, smList, curSm, tList, curT]) => {
                        return [
                            sType, cUri, sId, dbList, curDb, smList, curSm, tList, curT, data, `select * from ${selectedTable || '<table_name>'}`
                        ] as PartialDatabaseOptions;
                    });
                } else {
                    setOptions(([sType, cUri, sId, dbList, curDb, smList, curSm, tList]) => {
                        return [sType, cUri, sId, dbList, curDb, smList, curSm, tList] as PartialDatabaseOptions;
                    });
                }
            }).finally(() => {
                setLoadingAnimation(false);
            });
        }
    }, [sourceType, connectUri, sourceId, databaseList, selectedDatabase, schemaList, selectedSchema, tableList, selectedTable, setLoadingAnimation]);

    const databaseSelector: IDropdownOption[] | null = useMemo(() => {
        return databaseList?.map<IDropdownOption>(
            dbName => ({
                text: dbName,
                key: dbName,
            })
        ) ?? null;
    }, [databaseList]);

    const schemaSelector: IDropdownOption[] | null = useMemo(() => {
        if (whichDataset?.requiredSchema && Array.isArray(schemaList)) {
            return schemaList.map<IDropdownOption>(
                dbName => ({
                    text: dbName,
                    key: dbName,
                })
            ) ?? [];
        }

        return null;
    }, [whichDataset, schemaList]);

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

    return (
        <Stack>
            {
                typeof sourceId !== 'number' && (
                    <>
                        <Stack horizontal tokens={StackTokens}>
                            <Dropdown
                                label={intl.get('dataSource.databaseType')}
                                style={{ width: inputWidth }}
                                options={datasetOptions}
                                selectedKey={sourceType}
                                onChange={(_, item) => {
                                    if (item) {
                                        setOptions([item.key as SupportedDatabaseType]);
                                    }
                                }}
                            />
                        </Stack>
                        {
                            whichDataset && (
                                <Stack tokens={StackTokens}>
                                    <TextField
                                        prefix={uriPrefix}
                                        label={intl.get('dataSource.connectUri')}
                                        required
                                        value={(connectUri ?? '').replace(uriPrefix ?? /^/, '')}
                                        placeholder={whichDataset.rule.replace(uriPrefix ?? /^/, '')}
                                        errorMessage={
                                            sourceId === null
                                                ? intl.get('dataSource.btn.connectFailed')
                                                : undefined
                                        }
                                        onChange={(_, uri) => {
                                            if (typeof uri === 'string') {
                                                setOptions([sourceType, `${uriPrefix ?? ''}${uri}`]);
                                            } else {
                                                setOptions([sourceType]);
                                            }
                                        }}
                                    />
                                    <PrimaryButton
                                        text={intl.get('dataSource.btn.connect')}
                                        style={{
                                            width: '20em',
                                        }}
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
                    </>
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
                                onClick={() => setOptions([sourceType])}
                            />
                        </Stack>
                        <Stack horizontal tokens={StackTokens}>
                            {
                                databaseSelector && (
                                    <Dropdown
                                        label={intl.get('dataSource.databaseName')}
                                        style={{ width: inputWidth }}
                                        options={databaseSelector}
                                        selectedKey={selectedDatabase}
                                        required
                                        onChange={(_, item) => {
                                            if (item && typeof connectUri === 'string' && databaseList) {
                                                setOptions([
                                                    sourceType,
                                                    connectUri,
                                                    sourceId,
                                                    databaseList,
                                                    item.key as string,
                                                ]);
                                            }
                                        }}
                                    />
                                )
                            }
                            {
                                schemaSelector && (
                                    <Dropdown
                                        label={intl.get('dataSource.schemaName')}
                                        style={{ width: inputWidth }}
                                        options={schemaSelector}
                                        selectedKey={selectedSchema}
                                        required
                                        onChange={(_, item) => {
                                            if (item && typeof connectUri === 'string' && databaseList !== undefined && selectedDatabase !== undefined && schemaList) {
                                                setOptions([
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
                                )
                            }
                            {
                                tableSelector && (
                                    <Dropdown
                                        label={intl.get('dataSource.tableName')}
                                        style={{ width: inputWidth }}
                                        options={tableSelector}
                                        selectedKey={selectedTable}
                                        required
                                        onChange={(_, item) => {
                                            if (item && typeof connectUri === 'string' && databaseList !== undefined && selectedDatabase !== undefined && (schemaList === null || Array.isArray(schemaList)) && selectedSchema !== undefined && tableList) {
                                                setOptions([
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
                                        tokens={StackTokens}
                                        style={{
                                            alignItems: 'flex-end',
                                            marginBlockEnd: '10px',
                                        }}
                                    >
                                        <TextField
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
                                                if (sql && typeof connectUri === 'string' && databaseList && typeof selectedDatabase === 'string' && (schemaList === null || Array.isArray(schemaList)) && selectedSchema !== undefined && tableList && typeof selectedTable === 'string' && tablePreview) {
                                                    setOptions([
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
                                            onClick={query}
                                        />
                                    </Stack>
                                </Stack>
                            )
                        }
                    </>
                )
            }
        </Stack>
    );
};


export default observer(DatabaseData);
