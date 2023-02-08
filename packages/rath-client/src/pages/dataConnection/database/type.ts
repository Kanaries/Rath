import type { TableInfo } from './api';
import type { TableData, TableLabels } from '.';

export type SupportedDatabaseType =
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
    | 'sqlserver';

export type AsyncStatus = 'empty' | 'pending' | 'resolved';

export type DatabaseOptions = {
    connectorReady: boolean;
    databaseType: SupportedDatabaseType;
    connectUri: string;
    sourceId: {
        status: AsyncStatus;
        value: number;
    };
    database: {
        status: AsyncStatus;
        options: string[];
        value?: string;
    };
    schema: {
        status: AsyncStatus;
        options: string[];
        value?: string;
    };
    table: {
        status: AsyncStatus;
        options: TableInfo[];
    };
    queryString: string;
    preview: {
        status: AsyncStatus;
        value?: TableData<TableLabels>;
    };
};
