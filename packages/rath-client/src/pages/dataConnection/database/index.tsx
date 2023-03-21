import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import intl from 'react-intl-universal';
import { IDropdownOption, Stack, registerIcons, PrimaryButton } from '@fluentui/react';
import { DataSourceType, IMuteFieldBase, IRow } from '../../../interfaces';
import { logDataImport } from '../../../loggers/dataImport';
import prefetch from '../../../utils/prefetch';
import { notify } from '../../../components/error';
import { DataSourceTag } from '../../../utils/storage';
import { rawData2DataWithBaseMetas } from '../../dataSource/utils';
import { useGlobalStore } from '../../../store';
import Progress from './progress';
import datasetOptions from './config';
import ConnectForm, { ConnectFormReadonly } from './connect-form';
import DropdownOrInput from './dropdown-or-input';
import useDatabaseReducer from './reducer';
import { getSourceId, pingConnector } from './api';
import CustomConfig from './customConfig';
import QueryEditor from './query-editor';
import TablePreview from './table-preview';

export const StackTokens = {
    childrenGap: 20,
};

const iconPathPrefix = '/assets/icons/';

registerIcons({
    icons: Object.fromEntries(
        datasetOptions.map<[string, JSX.Element]>((opt) => [
            opt.key,
            opt.icon ? (
                <img
                    role="presentation"
                    aria-hidden
                    src={`${iconPathPrefix}${opt.icon}`}
                    alt={opt.text}
                    style={{
                        width: '100%',
                        height: '100%',
                    }}
                />
            ) : (
                <></>
            ),
        ])
    ),
});

export type TableLabels = {
    key: string;
    colIndex: number;
    dataType: string | null;
}[];

type TableRowItem<TL extends TableLabels> = {
    [key in keyof TL]: any;
};

export interface TableData<TL extends TableLabels = TableLabels> {
    columns: TL;
    rows: TableRowItem<TL>[];
}

interface DatabaseDataProps {
    onClose: () => void;
    onDataLoaded: (fields: IMuteFieldBase[], dataSource: IRow[], name: string, tag: DataSourceTag) => void;
    setLoadingAnimation: (on: boolean) => void;
}

export const inputWidth = '180px';

const DatabaseData: React.FC<DatabaseDataProps> = ({ onClose, onDataLoaded, setLoadingAnimation }) => {
    const { progress, actions } = useDatabaseReducer(setLoadingAnimation);
    const [loading, setLoading] = useState<boolean>(false);
    const { userStore } = useGlobalStore();

    const { connectorReady, databaseType, connectUri, sourceId, database, schema, table, queryString, preview } = progress;

    const ping = useCallback(async () => {
        try {
            setLoading(true);
            const ok = await pingConnector();
            if (ok) {
                actions.setConnectorStatus(true);
            }
        } catch (error) {
            actions.setConnectorStatus(false);
            notify({
                type: 'error',
                title: 'ping connector error',
                content: `${error}`,
            });
        } finally {
            setLoading(false);
        }
    }, [actions]);

    useEffect(() => {
        ping();
    }, [ping]);

    // prefetch icons
    useEffect(() => {
        datasetOptions.forEach(({ icon }) => {
            if (icon) {
                prefetch(`${iconPathPrefix}${icon}`);
            }
        });
    }, []);

    const whichDatabase = datasetOptions.find((which) => which.key === databaseType)!;

    const { hasDatabase = true, databaseEnumerable = true, requiredSchema = false, schemaEnumerable = true } = whichDatabase;

    useEffect(() => {
        setLoadingAnimation(false);

        return () => setLoadingAnimation(false);
    }, [setLoadingAnimation]);

    const handleConnectionTest = useCallback(async () => {
        if (connectUri && Number.isNaN(sourceId.value)) {
            actions.setSourceId({
                status: 'pending',
                value: NaN,
            });
            setLoadingAnimation(true);
            const sId = await getSourceId(databaseType, connectUri);
            setLoadingAnimation(false);
            if (sId === null) {
                return;
            }
            actions.setSourceId({
                status: 'resolved',
                value: sId,
            });
        }
    }, [databaseType, connectUri, sourceId, setLoadingAnimation, actions]);

    const databaseSelector: IDropdownOption[] | null = useMemo(() => {
        if (hasDatabase && databaseEnumerable) {
            return database.options.map<IDropdownOption>((dbName) => ({
                text: dbName,
                key: dbName,
            }));
        }

        return null;
    }, [database.options, hasDatabase, databaseEnumerable]);

    const schemaSelector: IDropdownOption[] | null = useMemo(() => {
        if (requiredSchema && schemaEnumerable) {
            return (
                schema.options.map<IDropdownOption>((sName) => ({
                    text: sName,
                    key: sName,
                })) ?? []
            );
        }

        return null;
    }, [schema.options, requiredSchema, schemaEnumerable]);

    const submitPendingRef = useRef(false);

    const submit = async () => {
        if (!preview.value || submitPendingRef.current) {
            return;
        }
        submitPendingRef.current = true;
        try {
            const { rows, columns } = preview.value;
            const data = await rawData2DataWithBaseMetas(
                rows.map((row) => Object.fromEntries(row.map<[string, any]>((val, colIdx) => [columns?.[colIdx]?.key ?? `${colIdx}`, val])))
            );
            const { dataSource, fields } = data;
            const name = [database.value, schema.value].filter(Boolean).join('.');

            logDataImport({
                dataType: `Database/${databaseType}`,
                name,
                fields,
                dataSource: dataSource.slice(0, 10),
                size: dataSource.length,
            });
            userStore.saveDataSourceOnCloudOnlineMode({
                name,
                datasourceType: DataSourceType.Database,
                linkInfo: {
                    databaseType,
                    connectUri,
                    database,
                    schema,
                    table,
                    queryString,
                },
            });
            onDataLoaded(fields, dataSource, name, DataSourceTag.DATABASE);

            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            submitPendingRef.current = false;
        }
    };

    return (
        <div>
            <CustomConfig ping={ping} loading={loading} />
            {connectorReady && (
                <Stack>
                    <Progress progress={progress} />
                    {sourceId.status === 'empty' && (
                        <ConnectForm
                            sourceType={databaseType}
                            setSourceType={actions.setDatabaseType}
                            whichDatabase={whichDatabase}
                            sourceId={sourceId}
                            connectUri={connectUri}
                            setConnectUri={actions.setConnectUri}
                            handleConnectionTest={handleConnectionTest}
                        />
                    )}
                    {sourceId.status === 'resolved' && (
                        <>
                            <ConnectFormReadonly connectUri={connectUri!} resetConnectUri={() => actions.setConnectorStatus(true)} />
                            <Stack horizontal tokens={StackTokens} style={{ flexDirection: 'column' }}>
                                {table.status === 'resolved' ? (
                                    <>
                                        <QueryEditor
                                            tableEnumerable={whichDatabase.tableEnumerable ?? true}
                                            tables={table.options}
                                            query={queryString}
                                            setQuery={actions.setQueryString}
                                            preview={actions.genPreview}
                                        />
                                        {preview.value && (
                                            <div>
                                                <header
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                    }}
                                                >
                                                    <span>{intl.get('common.preview')}</span>
                                                    <PrimaryButton onClick={submit}>{intl.get('common.submit')}</PrimaryButton>
                                                </header>
                                                <TablePreview data={preview.value} />
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        {database.status === 'resolved' && hasDatabase && (
                                            <DropdownOrInput
                                                name="dataSource.databaseName"
                                                options={databaseSelector}
                                                value={database.value}
                                                setValue={actions.setDatabase}
                                            />
                                        )}
                                        {schema.status === 'resolved' && requiredSchema && (
                                            <DropdownOrInput
                                                name="dataSource.schemaName"
                                                options={schemaSelector}
                                                value={schema.value}
                                                setValue={actions.setSchema}
                                            />
                                        )}
                                    </>
                                )}
                            </Stack>
                        </>
                    )}
                </Stack>
            )}
        </div>
    );
};

export default observer(DatabaseData);
