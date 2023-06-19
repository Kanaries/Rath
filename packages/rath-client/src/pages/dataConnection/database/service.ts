import { notify } from "../../../components/error";
import { getRathError } from "../../../rath-error";
import databaseOptions from "./options";
import type { SupportedDatabaseType, TableColInfo, TableInfo, TableRowData } from "./interfaces";


const apiPath = '/api/get_connection';

export type DatabaseApiOperator = (
    | 'ping'
    | 'getDatabases'
    | 'getSchemas'
    | 'getTables'
    | 'getTableDetail'
    | 'getResult'
);

export type DatabaseApiParams = {
    connectUri: string;
    sourceType: SupportedDatabaseType;
    operator: DatabaseApiOperator;
    databaseName: string;
    tableName: string;
    schemaName: string;
    tableHeadingCount: string;
    query: string;
    credentials: Record<string, string>;
};

export type DatabaseRequestPayload<P extends Exclude<DatabaseApiOperator, 'ping'>> = {
    uri: DatabaseApiParams['connectUri'];
    sourceType: DatabaseApiParams['sourceType'];
    func: P;
    db?: DatabaseApiParams['databaseName'] | null;
    schema?: DatabaseApiParams['schemaName'] | null;
    table?: DatabaseApiParams['tableName'] | null;
    /** @default "500" */
    rowsNum?: DatabaseApiParams['tableHeadingCount'] | null;
    query?: DatabaseApiParams['query'] | null;
    credentials?: Record<string, string>;
};

type Rq<T, Keys extends keyof T> = T & Required<Pick<T, Keys>>;

export type DatabaseRequestData = {
    ping: {
        func: 'ping';
    };
    getDatabases: DatabaseRequestPayload<'getDatabases'>;
    getSchemas: DatabaseRequestPayload<'getSchemas'>;
    getTables: DatabaseRequestPayload<'getTables'>;
    getTableDetail: Rq<DatabaseRequestPayload<'getTableDetail'>, 'table'>;
    getResult: Rq<DatabaseRequestPayload<'getResult'>, 'query'>;
};

export type DatabaseResponseData = {
    ping: undefined;
    getDatabases: string[];
    getSchemas: string[];
    getTables: TableInfo[];
    getTableDetail: {
        meta: TableColInfo[];
        columns: string[];
        rows: TableRowData[];
    };
    getResult: {
        columns: string[];
        rows: TableRowData[];
    };
};

type WrappedResponse<T> = {
    success: true;
    data: T;
} | {
    success: false;
    message: string;
};

const combinedDatabaseService = async <O extends DatabaseApiOperator>(
    server: string, operator: O, payload: Omit<DatabaseRequestData[O], 'func'>
): Promise<DatabaseResponseData[O]> => {
    const res = await fetch(
        `${server}${apiPath}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...payload,
                func: operator,
            }),
        }
    ).then(res => res.ok ? res.json() : (() => { throw new Error() })()) as WrappedResponse<DatabaseResponseData[O]>;

    if (res.success) {
        return res.data;
    } else {
        throw new Error(res.message);
    }
};

export const checkServerConnection = async (server: string): Promise<false | number> => {
    try {
        const beginTime = Date.now();
        await combinedDatabaseService(server, 'ping', {});
        const endTime = Date.now();
        return endTime - beginTime;
    } catch (error) {
        const rathError = getRathError('ConnectorError', error);
        console.warn(rathError);
        return false;
    }
};

export const fetchDatabaseList = async (server: string, payload: Omit<DatabaseRequestData['getDatabases'], 'func'>): Promise<string[]> => {
    try {
        return await combinedDatabaseService(server, 'getDatabases', payload);
    } catch (error) {
        const rathError = getRathError('FetchDatabaseListFailed', error);
        notify(rathError);
        throw error;
    }
};

export const fetchSchemaList = async (server: string, payload: Omit<DatabaseRequestData['getSchemas'], 'func'>): Promise<string[]> => {
    try {
        return await combinedDatabaseService(server, 'getSchemas', payload);
    } catch (error) {
        const rathError = getRathError('FetchSchemaListFailed', error);
        notify(rathError);
        throw error;
    }
};

export const fetchTableList = async (server: string, payload: Omit<DatabaseRequestData['getTables'], 'func'>): Promise<TableInfo[]> => {
    try {
        return await combinedDatabaseService(server, 'getTables', payload);
    } catch (error) {
        const rathError = getRathError('FetchTableListFailed', error);
        notify(rathError);
        throw error;
    }
};

export const fetchTableDetail = async (server: string, payload: Omit<DatabaseRequestData['getTableDetail'], 'func'>): Promise<DatabaseResponseData['getTableDetail']> => {
    try {
        return await combinedDatabaseService(server, 'getTableDetail', payload);
    } catch (error) {
        const rathError = getRathError('FetchTableListFailed', error);
        notify(rathError);
        throw error;
    }
};

export const fetchQueryResult = async (server: string, payload: Omit<DatabaseRequestData['getResult'], 'func'>): Promise<DatabaseResponseData['getResult']> => {
    try {
        const config = databaseOptions.find(opt => opt.key === payload.sourceType);
        if (!config) {
            throw new Error(`Database ${payload.sourceType} is not supported.`);
        }
        const requiresCredentials = Boolean(config.credentials);
        if (requiresCredentials && !payload.credentials) {
            throw new Error(`Credentials is required but not given.`);
        }
        return await combinedDatabaseService(server, 'getResult', payload);
    } catch (error) {
        const rathError = getRathError('QueryExecutionError', error, { sql: payload.query ?? '' });
        notify(rathError);
        throw error;
    }
};
