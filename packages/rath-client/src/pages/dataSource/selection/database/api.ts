import { SupportedDatabaseType, TableData, TableLabels } from '.';
import { notify } from '../../../../components/error';


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
    success: boolean;
    data: string[];
} | {
    success: false;
    msg: any; // FIXME: `message`?
};

export const getSourceId = async (
    sourceType: SupportedDatabaseType,
    uri: string,
): Promise<number | null> => {
    // FIXME: dev debug
    await new Promise(resolve => setTimeout(resolve, 200 * Math.random()));
    return 12;

    try {
        const res = await fetch(
            '/api/upsert', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sourceType,
                    uri,
                }),
            }
        ).then(res => res.ok ? res.json() : (()=>{throw new Error()})()) as TestConnectionResult;

        return res?.success ? res.data : null;
    } catch (error) {
        console.error(error);

        notify({
            title: 'Failed to get source id',
            type: 'error',
            content: `Failed to get source id. `
        });

        return null;
    }
};

export const listDatabases = async (sourceId: number): Promise<string[] | null> => {
    // FIXME: dev debug
    await new Promise(resolve => setTimeout(resolve, 300 * Math.random()));
    return ['database1', 'database2'];

    // try {
    //     const res = await fetch(
    //         '/api/database_list', {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //             },
    //             body: JSON.stringify({
    //                 sourceId,
    //             }),
    //         }
    //     ).then(res => res.ok ? res.json() : (()=>{throw new Error()})()) as ListDatabasesResult;

    //     return res?.success ? res.data : null;
    // } catch (error) {
    //     notify({
    //         title: 'Failed to get database list',
    //         type: 'error',
    //         content: `Failed to get database list. `
    //     });
        
    //     return null;
    // }
};

export const listSchemas = async (sourceId: number, db: string): Promise<string[] | null> => {
    // FIXME: dev debug
    await new Promise(resolve => setTimeout(resolve, 400 * Math.random()));
    return ['schema1', 'schema2', 'schema3'];

    // try {
    //     const res = await fetch(
    //         '/api/schema_list', {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //             },
    //             body: JSON.stringify({
    //                 sourceId,
    //                 db,
    //             }),
    //         }
    //     ).then(res => res.ok ? res.json() : (()=>{throw new Error()})()) as ListDatabasesResult;

    //     return res?.success ? res.data : null;
    // } catch (error) {
    //     notify({
    //         title: 'Failed to get schema list',
    //         type: 'error',
    //         content: `Failed to get schema list. \n ${error}`
    //     });
        
    //     return null;
    // }
};

export const listTables = async (sourceId: number, db: string, schema?: string | undefined): Promise<string[] | null> => {
    // FIXME: dev debug
    await new Promise(resolve => setTimeout(resolve, 600 * Math.random()));
    return ['table1', 'table2', 'table3', 'table4', 'table5'];
    
    // try {
    //     const res = await fetch(
    //         '/api/table_list', {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //             },
    //             body: JSON.stringify(
    //                 typeof schema === 'string' ? {
    //                     sourceId,
    //                     db,
    //                     schema,
    //                 } : {
    //                     sourceId,
    //                     db,
    //                 }
    //             ),
    //         }
    //     ).then(res => res.ok ? res.json() : (()=>{throw new Error()})()) as ListDatabasesResult;

    //     return res?.success ? res.data : null;
    // } catch (error) {
    //     notify({
    //         title: 'Failed to get table list',
    //         type: 'error',
    //         content: `Failed to get table list. \n ${error}`
    //     });

    //     return null;
    // }
};

export const fetchTablePreview = async (sourceId: number, db: string, schema: string | undefined, table: string): Promise<TableData<TableLabels> | null> => {
    // FIXME: dev debug
    await new Promise(resolve => setTimeout(resolve, 1400 * Math.random()));
    return {
        columns: [
            {
                key: 'name',
                colIndex: 0,
                dataType: null,
            },
            {
                key: 'age',
                colIndex: 1,
                dataType: 'Int64',
            },
        ],
        rows: [
            ['admin', 18],
            ['jhon', 24],
            ['nobody', 234],
        ],
    };
    
    try {
        const res = await fetch(
            '/api/data', {
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

        return res?.success ? res.data : null;
    } catch (error) {
        notify({
            title: 'Failed to get table data',
            type: 'error',
            content: `Failed to get table data. \n ${error}`
        });

        return null;
    }
};

export const requestSQL = async (sourceId: number, queryString: string): Promise<TableData<TableLabels> | null> => {
    // FIXME: dev debug
    await new Promise(resolve => setTimeout(resolve, 1400 * Math.random()));
    return {
        columns: [
            {
                key: 'name',
                colIndex: 0,
                dataType: null,
            },
            {
                key: 'age',
                colIndex: 1,
                dataType: 'Int64',
            },
        ],
        rows: [
            ['admin', 18],
            ['jhon', 24],
            ['nobody', 234],
        ],
    };
    
    try {
        const res = await fetch(
            '/api/execute', {
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

        return res?.success ? res.data : null;
    } catch (error) {
        notify({
            title: 'Failed to execute SQL query',
            type: 'error',
            content: `Failed to execute SQL query "${queryString}". \n ${error}`
        });

        return null;
    }
};

