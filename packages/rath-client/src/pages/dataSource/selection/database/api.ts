import { SupportedDatabaseType, TableData, TableLabels } from '.';
import { notify } from '../../../../components/error';
import type { IDatasetBase } from '../../../../interfaces';
import { transformRawDataService } from '../../utils';


const apiPathPrefix = '/api';

interface TableDataResult<TL extends TableLabels> {
    success: boolean;
    data: TableData<TL>;
}

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
            `${apiPathPrefix}/upsert`, {
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

        return res?.success ? res.data : null;
    } catch (error) {
        notify({
            title: 'Failed to get source id',
            type: 'error',
            content: `Failed to get source id. `
        });

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
        notify({
            title: 'Failed to get database list',
            type: 'error',
            content: `Failed to get database list. `
        });
        
        return null;
    }
};

export const listSchemas = async (sourceId: number, db: string): Promise<string[] | null> => {
    try {
        const res = await fetch(
            `${apiPathPrefix}/schema_list`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sourceId,
                    db,
                }),
            }
        ).then(res => res.ok ? res.json() : (()=>{throw new Error()})()) as ListDatabasesResult;

        return res.success ? res.data : (() => { throw new Error(res.message) })();
    } catch (error) {
        notify({
            title: 'Failed to get schema list',
            type: 'error',
            content: `Failed to get schema list. \n ${error}`
        });
        
        return null;
    }
};

export const listTables = async (sourceId: number, db: string, schema?: string | undefined): Promise<string[] | null> => {
    try {
        const res = await fetch(
            `${apiPathPrefix}/table_list`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(
                    typeof schema === 'string' ? {
                        sourceId,
                        db,
                        schema,
                    } : {
                        sourceId,
                        db,
                    }
                ),
            }
        ).then(res => res.ok ? res.json() : (()=>{throw new Error()})()) as ListDatabasesResult;

        return res.success ? res.data : (() => { throw new Error(res.message) })();
    } catch (error) {
        notify({
            title: 'Failed to get table list',
            type: 'error',
            content: `Failed to get table list. \n ${error}`
        });

        return null;
    }
};

export const fetchTablePreview = async (sourceId: number, db: string, schema: string | undefined, table: string): Promise<TableData<TableLabels> | null> => {
    try {
        const res = await fetch(
            `${apiPathPrefix}/table_detail`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(
                    typeof schema === 'string' ? {
                        sourceId,
                        db,
                        schema,
                    } : {
                        sourceId,
                        db,
                    }
                ),
            }
        ).then(res => res.ok ? res.json() : (()=>{throw new Error()})()) as TableDataResult<TableLabels>;

        return res.success ? res.data : null;
    } catch (error) {
        notify({
            title: 'Failed to get table data',
            type: 'error',
            content: `Failed to get table data. \n ${error}`
        });

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
        ).then(res => res.ok ? res.json() : (()=>{throw new Error()})()) as TableDataResult<TableLabels>;

        const data = res.success ? res.data : (() => { throw new Error() })();
        
        if (!data) {
            return null;
        }

        return await transformRawDataService(
            data.rows.map(
                row => Object.fromEntries(
                    row.map<[string, any]>((val, colIdx) => [data.columns[colIdx]!.key, val])
                )
            )
        );
    } catch (error) {
        notify({
            title: 'Failed to execute SQL query',
            type: 'error',
            content: `Failed to execute SQL query "${queryString}". `
        });

        return null;
    }
};

