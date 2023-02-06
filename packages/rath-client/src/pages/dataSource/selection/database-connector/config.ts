import type { IDropdownOption } from '@fluentui/react';
import type { SupportedDatabaseType } from "./type";


const databaseOptions = ([
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
    {
        text: 'Apache Drill',
        key: 'drill',
        rule: 'drill+sadrill://<username>:<password>@<host>:<port>/<storage_plugin>?use_ssl=True',
        hasDatabase: false,
        requiredSchema: true,
        icon: 'apachedrill.png',
    },
    {
        text: 'snowflake',
        key: 'snowflake',
        rule: 'snowflake://{user}:{password}@{account}.{region}/{database}?role={role}&warehouse={warehouse}',
        requiredSchema: true,
        icon: 'snowflake.svg',
    },
    {
        text: 'Demo',
        key: 'demo',
        rule: '(empty)',
        hasDatabase: false,
        hasTableList: false,
        icon: '',
    },
] as Array<
    & IDropdownOption
    & {
        key: SupportedDatabaseType | 'demo';
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

export default databaseOptions;
