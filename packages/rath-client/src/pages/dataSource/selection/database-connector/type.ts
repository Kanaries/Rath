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
    | 'drill'
    | 'druid'
    | 'snowflake'
    | 'bigquery'
    | 'demo'
);

export type TableColInfo = {
    key: string;
    colIndex: number;
    dataType: null | string;
};

export type TableRowData = (number | string)[];

export type TableInfo = {
    name: string;
    meta: TableColInfo[];
};
