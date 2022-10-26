import type { TableData, TableLabels } from '.';
import type { TableInfo } from './api';


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

export type ThisOptionIsNotRequired = null;

export type DatabaseOptions = [
    connectorReady: boolean,
    sourceType: SupportedDatabaseType,
    connectUri: string,
    sourceId: 'pending' | number | null,
    databaseList: string[] | 'input' | ThisOptionIsNotRequired,
    selectedDatabase: string | ThisOptionIsNotRequired,
    schemaList: 'pending' | 'input' | string[] | ThisOptionIsNotRequired,
    selectedSchema: string | ThisOptionIsNotRequired,
    tableList: 'pending' | 'input' | TableInfo[] | ThisOptionIsNotRequired,
    selectedTable: string | ThisOptionIsNotRequired,
    tablePreview: 'pending' | TableData<TableLabels>,
    queryStrings: string[],
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

export type PartialDatabaseOptions = PartialArrayAsProgress<DatabaseOptions, true>;
