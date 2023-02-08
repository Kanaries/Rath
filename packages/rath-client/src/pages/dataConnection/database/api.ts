import { notify } from '../../../components/error';
import { getRathError } from '../../../rath-error';
import { SupportedDatabaseType } from './type';
import type { TableData, TableLabels } from '.';

const apiPathPrefix = '/api';

const DB_CONNECTOR_SERVICE_KEY = 'db_api';

export function getConnectorServiceInfo() {
    return localStorage.getItem(DB_CONNECTOR_SERVICE_KEY) || 'https://gateway.kanaries.net/connector';
}

export function setConnectorServiceInfo(info: string) {
    localStorage.setItem(DB_CONNECTOR_SERVICE_KEY, info);
}

function getAPIPathPrefix(apiPrefix: string | undefined = '') {
    const servicePrefix = getConnectorServiceInfo();
    return `${servicePrefix}${apiPrefix}`;
}

type TableDataResult<TL extends TableLabels> =
    | {
          success: true;
          data: TableData<TL>;
      }
    | {
          success: false;
          message: string;
      };

interface TestConnectionResult {
    success: boolean;
    // 先直接返回，未来需要放到 token 里
    data: number;
}

type ListDatabasesResult =
    | {
          success: true;
          data: string[];
      }
    | {
          success: false;
          message: string;
      };

export type TableInfo = {
    name: string;
    meta: {
        key: string;
        colIndex: number;
        dataType: string | null;
    }[];
};

type TableList = TableInfo[];

type ListTableResult =
    | {
          success: true;
          data: TableList;
      }
    | {
          success: false;
          message: string;
      };

export const pingConnector = async (): Promise<boolean> => {
    try {
        const res = (await fetch(`${getAPIPathPrefix()}/ping`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        }).then((res) =>
            res.ok
                ? res.json()
                : (() => {
                      throw new Error();
                  })()
        )) as TestConnectionResult;

        if (!res.success) {
            throw new Error('Operation failed.');
        }

        return true;
    } catch (error) {
        const rathError = getRathError('ConnectorError', error);

        notify(rathError);

        return false;
    }
};

export const getSourceId = async (sourceType: SupportedDatabaseType, uri: string): Promise<number | null> => {
    try {
        const res = (await fetch(`${getAPIPathPrefix(apiPathPrefix)}/upsert`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sourceType,
                uri,
            }),
        }).then((res) =>
            res.ok
                ? res.json()
                : (() => {
                      throw new Error();
                  })()
        )) as TestConnectionResult;

        if (!res.success) {
            throw new Error('Operation failed.');
        }

        return res.data;
    } catch (error) {
        const rathError = getRathError('SourceIdError', error);

        notify(rathError);

        return null;
    }
};

export const listDatabases = async (sourceId: number): Promise<string[] | null> => {
    try {
        const res = (await fetch(`${getAPIPathPrefix(apiPathPrefix)}/database_list`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sourceId,
            }),
        }).then((res) =>
            res.ok
                ? res.json()
                : (() => {
                      throw new Error();
                  })()
        )) as ListDatabasesResult;

        return res.success
            ? res.data
            : (() => {
                  throw new Error(res.message);
              })();
    } catch (error) {
        const rathError = getRathError('FetchDatabaseListFailed', error);

        notify(rathError);

        return null;
    }
};

export const listSchemas = async (sourceId: number, db: string | null): Promise<string[] | null> => {
    try {
        const res = (await fetch(`${getAPIPathPrefix(apiPathPrefix)}/schema_list`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sourceId,
                db,
            }),
        }).then((res) =>
            res.ok
                ? res.json()
                : (() => {
                      throw new Error();
                  })()
        )) as ListDatabasesResult;

        return res.success
            ? res.data
            : (() => {
                  throw new Error(res.message);
              })();
    } catch (error) {
        const rathError = getRathError('FetchSchemaListFailed', error);

        notify(rathError);

        return null;
    }
};

export const listTables = async (sourceId: number, db: string | null, schema: string | null): Promise<TableList | null> => {
    try {
        const res = (await fetch(`${getAPIPathPrefix(apiPathPrefix)}/table_list`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sourceId,
                db,
                schema,
            }),
        }).then((res) =>
            res.ok
                ? res.json()
                : (() => {
                      throw new Error();
                  })()
        )) as ListTableResult;

        return res.success
            ? res.data
            : (() => {
                  throw new Error(res.message);
              })();
    } catch (error) {
        const rathError = getRathError('FetchTableListFailed', error);

        notify(rathError);

        return null;
    }
};

export const fetchTablePreview = async (
    sourceId: number,
    db: string | null,
    schema: string | null,
    table: string | null,
    silent: boolean = false
): Promise<TableData<TableLabels> | null> => {
    try {
        const res = (await fetch(`${getAPIPathPrefix(apiPathPrefix)}/table_detail`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sourceId,
                db,
                schema,
                table,
            }),
        }).then((res) =>
            res.ok
                ? res.json()
                : (() => {
                      throw new Error();
                  })()
        )) as TableDataResult<TableLabels>;

        return res.success
            ? res.data
            : (() => {
                  throw new Error(res.message);
              })();
    } catch (error) {
        if (!silent) {
            const rathError = getRathError('FetchTablePreviewFailed', error);

            notify(rathError);
        }

        return null;
    }
};

export const requestSQL = async (sourceId: number, queryString: string) => {
    try {
        const res = (await fetch(`${getAPIPathPrefix(apiPathPrefix)}/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sourceId,
                query: queryString,
            }),
        }).then((res) =>
            res.ok
                ? res.json()
                : (() => {
                      throw new Error();
                  })()
        )) as TableDataResult<TableLabels>;

        const data = res.success
            ? res.data
            : (() => {
                  throw new Error(res.message);
              })();

        if (!data) {
            return null;
        }

        return data;
    } catch (error) {
        const rathError = getRathError('QueryExecutionError', error, { sql: queryString });

        notify(rathError);

        return null;
    }
};
