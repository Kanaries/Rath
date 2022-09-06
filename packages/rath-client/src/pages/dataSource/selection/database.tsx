import React, { useCallback, useEffect, useState } from  'react';
import { observer } from 'mobx-react-lite';
import { IMuteFieldBase, IRow } from '../../../interfaces';
import { DefaultButton, Dropdown, IDropdownOption, PrimaryButton, ProgressIndicator, Stack, TextField } from 'office-ui-fabric-react';
import intl from "react-intl-universal";


const StackTokens = {
    childrenGap: 20
};

export type SupportedDatabaseType = (
    | 'mysql'
    | 'progresql'
);

const datasetOptions: (IDropdownOption & { key: SupportedDatabaseType })[] = [
    {
        text: 'MySQL',
        key: 'mysql',
    },
    {
        text: 'ProgreSQL',
        key: 'progresql',
    },
];

interface TestConnectionResult {
    success: boolean;
    // 先直接返回，未来需要放到 token 里
    data: number;
}

interface ListDatabasesResult {
    success: boolean;
    data: string[];
}

type TableLabels = {
    key: string;
    colIndex: number;
    dataType: string | null;
}[];

type TableRowItem<TL extends TableLabels> = {
    [key in keyof TL]: any
};

interface TableData<TL extends TableLabels> {
    columns: TL;
    rows: TableRowItem<TL>[];
}

interface TableDataResult<TL extends TableLabels> {
    success: boolean;
    data: TableData<TL>;
}

const getSourceId = async (
    sourceType: SupportedDatabaseType,
    userName: string,
    password: string,
    host: string,
    database: string,
): Promise<number | null> => {
    try {
        const res = await fetch(
            '/api/connect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sourceType,
                    uri: `${sourceType}://${userName}:${password}@${host}/${database}`,
                }),
            }
        ).then(res => res.json()) as TestConnectionResult;

        return res.success ? res.data : null;
    } catch (error) {
        return null;
    }
};

const listDatabases = async (sourceId: number): Promise<string[] | null> => {
    try {
        const res = await fetch(
            '/api/db_list', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sourceId,
                }),
            }
        ).then(res => res.json()) as ListDatabasesResult;

        return res.success ? res.data : null;
    } catch (error) {
        return null;
    }
};

const listSchemas = async (sourceId: number, db: string): Promise<string[] | null> => {
    try {
        const res = await fetch(
            '/api/schema_list', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sourceId,
                    db,
                }),
            }
        ).then(res => res.json()) as ListDatabasesResult;

        return res.success ? res.data : null;
    } catch (error) {
        return null;
    }
};

const listTables = async (sourceId: number, db: string, schema?: string | undefined): Promise<string[] | null> => {
    try {
        const res = await fetch(
            '/api/table_list', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
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
        ).then(res => res.json()) as ListDatabasesResult;

        return res.success ? res.data : null;
    } catch (error) {
        return null;
    }
};

const fetchTable = async <TL extends TableLabels>(sourceId: number, db: string, schema: string | undefined, table: string): Promise<TableData<TL> | null> => {
    try {
        const res = await fetch(
            '/api/data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
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
        ).then(res => res.json()) as TableDataResult<TL>;

        return res.success ? res.data : null;
    } catch (error) {
        return null;
    }
};

const requestSQL = async <TL extends TableLabels>(sourceId: number, queryString: string): Promise<TableData<TL> | null> => {
    try {
        const res = await fetch(
            '/api/???', { // FIXME: unknown
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sourceId,
                    query: queryString,
                }),
            }
        ).then(res => res.json()) as TableDataResult<TL>;

        return res.success ? res.data : null;
    } catch (error) {
        return null;
    }
};

interface DatabaseDataProps {
    onClose: () => void;
    onDataLoaded: (fields: IMuteFieldBase[], dataSource: IRow[]) => void;
}

const DatabaseData: React.FC<DatabaseDataProps> = ({ onClose, onDataLoaded }) => {
    const [sourceType, setSourceType] = useState<SupportedDatabaseType>('mysql');
    
    return (
        <div>
            <Stack horizontal tokens={StackTokens}>
                <Dropdown
                    label={intl.get('dataSource.databaseType')}
                    style={{ width: '160px' }}
                    options={datasetOptions}
                    selectedKey={sourceType}
                    onChange={(e, item) => {
                        item && setSourceType(item.key as SupportedDatabaseType)
                    }}
                />
            </Stack>
        </div>
    );
};


export default observer(DatabaseData);
