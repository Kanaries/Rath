import type { IDropdownOption } from '@fluentui/react';
import type { SupportedDatabaseType } from "./interfaces";


export type DatabaseLevelType = 'database' | 'schema' | 'table';

export type DatabaseLevelConfig<T extends DatabaseLevelType = DatabaseLevelType> = {
    type: T;
    /** @default true */
    enumerable?: boolean;
};

const databaseOptions: Array<
    & IDropdownOption
    & {
        key: SupportedDatabaseType;
        icon?: string;
        rule: string;
        levels: DatabaseLevelConfig[];
        credentials?: 'json' | undefined;
}> = [
    {
        text: 'PostgreSQL',
        key: 'postgres',
        rule: 'postgresql://{userName}:{password}@{host}:{port}/{database}',
        levels: [{ type: 'schema' }, { type: 'table' }],
        icon: 'postgres.svg',
    },
    {
        text: 'ClickHouse',
        key: 'clickhouse',
        rule: 'clickhouse://{userName}:{password}@{host}:{port}/{database}',
        levels: [{ type: 'database' }, { type: 'table' }],
        icon: 'clickhouse.svg',
    },
    {
        text: 'MySQL',
        key: 'mysql',
        rule: 'mysql://{userName}:{password}@{host}/{database}',
        levels: [{ type: 'database' }, { type: 'table' }],
        icon: 'mysql.svg',
    },
    {
        text: 'Apache Kylin',
        key: 'kylin',
        rule: 'kylin://{username}:{password}@{hostname}:{port}/{project}?{param1}={value1}&{param2}={value2}',
        levels: [
            {
                type: 'schema',
                enumerable: false,
            },
            {
                type: 'table',
                enumerable: false,
            },
        ],
        icon: 'kylin.png'
    },
    {
        text: 'Oracle',
        key: 'oracle',
        rule: 'oracle://',
        levels: [{ type: 'table' }],
        icon: 'oracle.svg',
    },
    {
        text: 'Apache Doris',
        key: 'doris',
        rule: '',
        levels: [{ type: 'database' }, { type: 'table' }],
        icon: 'doris.png',
    },
    {
        text: 'Apache Impala',
        key: 'impala',
        rule: 'impala://{hostname}:{port}/{database}',
        levels: [{ type: 'database' }, { type: 'table' }],
        icon: 'impala.png',
    },
    {
        text: 'Amazon Athena',
        key: 'awsathena',
        rule: 'awsathena+rest://{aws_access_key_id}:{aws_secret_access_key}@athena.{region_name}.amazonaws.com/{',
        levels: [{ type: 'database' }, { type: 'table' }],
        icon: 'athena.png',
    },
    {
        text: 'Amazon Redshift',
        key: 'redshift',
        rule: 'redshift+psycopg2://<userName>:<DBPassword>@<AWS End Point>:5439/<Database Name>',
        levels: [{ type: 'database' }, { type: 'table' }],
        icon: 'redshift.svg',
    },
    {
        text: 'Amazon Spark SQL',
        key: 'sparksql',
        rule: 'hive://hive@{hostname}:{port}/{database}',
        levels: [{ type: 'database' }, { type: 'table' }],
        icon: 'sparksql.png',
    },
    {
        text: 'Apache Hive',
        key: 'hive',
        rule: 'hive://hive@{hostname}:{port}/{database}',
        levels: [{ type: 'database' }, { type: 'table' }],
        icon: 'hive.jpg',
    },
    {
        text: 'SQL Server',
        key: 'sqlserver',
        rule: 'mssql://',
        levels: [{ type: 'database' }, { type: 'schema' }, { type: 'table' }],
        icon: 'mssql.svg',
    },
    {
        text: 'Apache Drill',
        key: 'drill',
        rule: 'drill+sadrill://<username>:<password>@<host>:<port>/<storage_plugin>?use_ssl=True',
        levels: [{ type: 'database' }, { type: 'table' }],
        icon: 'apachedrill.png',
    },
    {
        text: 'Apache Druid',
        key: 'druid',
        rule: 'druid://<User>:<password>@<Host>:<Port-default-9088>/druid/v2/sql',
        levels: [{ type: 'schema' }, { type: 'table' }],
        icon: 'druid.png',
    },
    {
        text: 'snowflake',
        key: 'snowflake',
        rule: 'snowflake://{user}:{password}@{account}.{region}/{database}?role={role}&warehouse={warehouse}',
        levels: [{ type: 'database' }, { type: 'schema' }, { type: 'table' }],
        icon: 'snowflake.svg',
    },
    {
        text: 'Demo',
        key: 'demo',
        rule: 'bigquery://kanaries-demo',
        levels: [{ type: 'database' }, { type: 'table' }],
        icon: '',
    },
    {
        text: 'Google BigQuery',
        key: 'bigquery',
        rule: 'bigquery://{project_id}',
        levels: [{ type: 'database' }, { type: 'table' }],
        credentials: 'json',
        icon: 'bigquery.jpeg',
    },
];

databaseOptions.sort((a, b) => a.text.localeCompare(b.text));

export default databaseOptions;
