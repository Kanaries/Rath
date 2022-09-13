import type { SupportedDatabaseType, TableData, TableLabels } from '.';
import { notify } from '../../../../components/error';
import type { IDatasetBase } from '../../../../interfaces';
import { getRathError } from '../../../../rath-error';
import { transformRawDataService } from '../../utils';


let apiPathPrefix = '/unknown-source-type';

type TableDataResult<TL extends TableLabels> = {
    success: true;
    data: TableData<TL>;
} | {
    success: false;
    message: string;
};

interface TestConnectionResult {
    success: boolean;
    // 先直接返回，未来需要放到 token 里
    data: number;
}

type ListDatabasesResult = {
    success: true;
    data: string[];
} | {
    success: false;
    message: string;
};

export const getSourceId = async (
    sourceType: SupportedDatabaseType,
    uri: string,
): Promise<number | null> => {
    try {
        const res = await fetch(
            `${'sqlite'}/upsert`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sourceType,
                    uri,
                }),
            }
        ).then(res => res.ok ? res.json() : (() => { throw new Error() })()) as TestConnectionResult;

        apiPathPrefix = `/${sourceType.replace(/^awsathena$/, 'athena')}`;

        return res?.success ? res.data : null;
    } catch (error) {
        const rathError = getRathError('SourceIdError', error);

        notify(rathError);

        return null;
    }
};

export const listDatabases = async (sourceId: number): Promise<string[] | null> => {
    try {
        const res = await fetch(
            `${apiPathPrefix}/database_list`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sourceId,
                }),
            }
        ).then(res => res.ok ? res.json() : (() => { throw new Error() })()) as ListDatabasesResult;

        return res.success ? res.data : (() => { throw new Error(res.message) })();
    } catch (error) {
        const rathError = getRathError('FetchDatabaseListFailed', error);

        notify(rathError);
        
        return null;
    }
};

export const listSchemas = async (sourceId: number, db: string | null): Promise<string[] | null> => {
    try {
        const res = await fetch(
            `${apiPathPrefix}/schema_list`.replace(/^\/postgres\/schema_list$/, '/postgres/database_list'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sourceId,
                    db,
                }),
            }
        ).then(res => res.ok ? res.json() : (() => { throw new Error() })()) as ListDatabasesResult;

        return res.success ? res.data : (() => { throw new Error(res.message) })();
    } catch (error) {
        const rathError = getRathError('FetchSchemaListFailed', error);

        notify(rathError);
        
        return null;
    }
};

export const listTables = async (sourceId: number, db: string | null, schema: string | null): Promise<string[] | null> => {
    try {
        const res = await fetch(
            `${apiPathPrefix}/table_list`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sourceId,
                    db,
                    [apiPathPrefix.match(/^\/(postgres|kylin)$/) ? 'db' : 'schema']: schema,
                }),
            }
        ).then(res => res.ok ? res.json() : (() => { throw new Error() })()) as ListDatabasesResult;

        return res.success ? res.data : (() => { throw new Error(res.message) })();
    } catch (error) {
        const rathError = getRathError('FetchTableListFailed', error);

        notify(rathError);

        return null;
    }
};

export const fetchTablePreview = async (sourceId: number, db: string | null, schema: string | null, table: string | null, silent: boolean = false): Promise<TableData<TableLabels> | null> => {
    try {
        const res = await fetch(
            `${apiPathPrefix}/table_detail`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sourceId,
                    db,
                    [apiPathPrefix.match(/^\/(postgres|kylin)$/) ? 'db' : 'schema']: schema,
                    table,
                }),
            }
        ).then(res => res.ok ? res.json() : (() => { throw new Error() })()) as TableDataResult<TableLabels>;

        return res.success ? res.data : (() => { throw new Error (res.message) })();
    } catch (error) {
        if (!silent) {
            const rathError = getRathError('FetchTablePreviewFailed', error);

            notify(rathError);
        }

        return null;
    }
};

export const requestSQL = async (sourceId: number, queryString: string): Promise<IDatasetBase | null> => {
    try {
        const res = await fetch(
            `${apiPathPrefix}/execute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sourceId,
                    query: queryString,
                }),
            }
        ).then(res => res.ok ? res.json() : (() => { throw new Error() })()) as TableDataResult<TableLabels>;

        const data = res.success ? res.data : (() => { throw new Error(res.message) })();
        
        if (!data) {
            return null;
        }

        return await transformRawDataService(
            data.rows.map(
                row => Object.fromEntries(
                    row.map<[string, any]>((val, colIdx) => [data.columns?.[colIdx]?.key ?? `${colIdx}`, val])
                )
            )
        );
    } catch (error) {
        const rathError = getRathError('QueryExecutionError', error, { sql: queryString });

        notify(rathError);

        return null;
    }
};

