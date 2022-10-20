import { useReducer } from 'react';
import type { PartialDatabaseOptions, SupportedDatabaseType, ThisOptionIsNotRequired } from './type';
import type { TableData, TableLabels } from '.';

export type ActionType = (
    | 'ENABLE_CONNECTOR'
    | 'SET_SOURCE_TYPE'
    | 'SET_CONNECT_URI'
    | 'SET_SOURCE_ID_AND_DATABASE_LIST'
    | 'SET_DATABASE'
    | 'SET_SCHEMA_LIST'
    | 'SET_SCHEMA'
    | 'SET_TABLE_LIST'
    | 'SET_TABLE'
    | 'SET_PREVIEW'
    | 'SET_SQL'
);

export type ActionPayload<T extends ActionType> = (
    T extends 'SET_CONNECT_URI' ? {
        uri: string;
    } : T extends 'SET_SOURCE_TYPE' ? {
        sourceType: SupportedDatabaseType;
    } : T extends 'SET_SOURCE_ID_AND_DATABASE_LIST' ? {
        sourceId: number | "pending" | null;
        dbList?: string[] | 'input' | ThisOptionIsNotRequired;
    } : T extends 'SET_DATABASE' ? {
        dbName: string;
    } : T extends 'SET_SCHEMA_LIST' ? {
        sList: 'pending' | string[] | 'input' | ThisOptionIsNotRequired;
    } : T extends 'SET_SCHEMA' ? {
        sName: string;
    } : T extends 'SET_TABLE_LIST' ? {
        tList: 'pending' | string[] | 'input' | ThisOptionIsNotRequired;
    } : T extends 'SET_TABLE' ? {
        tName: string;
    } : T extends 'SET_PREVIEW' ? {
        preview: 'pending' | TableData<TableLabels>;
    } : T extends 'SET_SQL' ? {
        sql: string;
    } : undefined
);

const useDatabaseReducer = () => {
    const [progress, dispatch] = useReducer(
        <T extends ActionType>(state: PartialDatabaseOptions, action: { type: T; payload: ActionPayload<T> }): PartialDatabaseOptions => {
            const [
                connectorReady,
                sourceType,
                connectUri,
                sourceId,
                databaseList,
                selectedDatabase,
                schemaList,
                selectedSchema,
                tableList,
                selectedTable,
                tablePreview,
            ] = state;
            
            switch (action.type) {
                case 'ENABLE_CONNECTOR': {
                    return [true, sourceType];
                }
                case 'SET_SOURCE_TYPE': {
                    const { sourceType: sType } = action.payload as ActionPayload<'SET_SOURCE_TYPE'>;

                    return [connectorReady, sType];
                }
                case 'SET_CONNECT_URI': {
                    const { uri } = action.payload as ActionPayload<'SET_CONNECT_URI'>;

                    return [connectorReady, sourceType, uri];
                }
                case 'SET_SOURCE_ID_AND_DATABASE_LIST': {
                    const { sourceId, dbList } = action.payload as ActionPayload<'SET_SOURCE_ID_AND_DATABASE_LIST'>;
                    
                    return dbList === undefined ? [
                        connectorReady, sourceType, connectUri!, sourceId
                    ] : dbList === null ? [
                        connectorReady, sourceType, connectUri!, sourceId,
                        dbList, null
                    ] : [
                        connectorReady, sourceType, connectUri!, sourceId,
                        dbList
                    ];
                }
                case 'SET_DATABASE': {
                    const { dbName } = action.payload as ActionPayload<'SET_DATABASE'>;

                    return [
                        connectorReady, sourceType, connectUri!, sourceId!,
                        databaseList!, dbName
                    ];
                }
                case 'SET_SCHEMA_LIST': {
                    const { sList } = action.payload as ActionPayload<'SET_SCHEMA_LIST'>;

                    return sList === null ? [
                        connectorReady, sourceType, connectUri!, sourceId!,
                        databaseList!, selectedDatabase!,
                        sList, null
                    ] : [
                        connectorReady, sourceType, connectUri!, sourceId!,
                        databaseList!, selectedDatabase!,
                        sList
                    ];
                }
                case 'SET_SCHEMA': {
                    const { sName } = action.payload as ActionPayload<'SET_SCHEMA'>;

                    return [
                        connectorReady, sourceType, connectUri!, sourceId!,
                        databaseList!, selectedDatabase!,
                        schemaList!, sName
                    ];
                }
                case 'SET_TABLE_LIST': {
                    const { tList } = action.payload as ActionPayload<'SET_TABLE_LIST'>;

                    return tList === null ? [
                        connectorReady, sourceType, connectUri!, sourceId!,
                        databaseList!, selectedDatabase!,
                        schemaList!, selectedSchema!,
                        tList, null
                    ] : [
                        connectorReady, sourceType, connectUri!, sourceId!,
                        databaseList!, selectedDatabase!,
                        schemaList!, selectedSchema!,
                        tList
                    ];
                }
                case 'SET_TABLE': {
                    const { tName } = action.payload as ActionPayload<'SET_TABLE'>;

                    return [
                        connectorReady, sourceType, connectUri!, sourceId!,
                        databaseList!, selectedDatabase!,
                        schemaList!, selectedSchema!,
                        tableList!, tName
                    ];
                }
                case 'SET_PREVIEW': {
                    const { preview } = action.payload as ActionPayload<'SET_PREVIEW'>;

                    return [
                        connectorReady, sourceType, connectUri!, sourceId!,
                        databaseList!, selectedDatabase!,
                        schemaList!, selectedSchema!,
                        tableList!, selectedTable!,
                        preview
                    ];
                }
                case 'SET_SQL': {
                    const { sql } = action.payload as ActionPayload<'SET_SQL'>;

                    return [
                        connectorReady, sourceType, connectUri!, sourceId!,
                        databaseList!, selectedDatabase!,
                        schemaList!, selectedSchema!,
                        tableList!, selectedTable!,
                        tablePreview!, sql
                    ];
                }
                default: {
                    return state;
                }
            }
        },
        [false, 'mysql'] as PartialDatabaseOptions
    );

    return [
        progress,
        dispatch
    ] as [
        Readonly<PartialDatabaseOptions>,
        <T extends ActionType>(action: { type: T; payload: ActionPayload<T> }) => void
    ];
};


export default useDatabaseReducer;
