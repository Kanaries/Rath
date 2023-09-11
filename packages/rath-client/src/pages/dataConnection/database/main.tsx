import { FC, useCallback, useEffect, useRef, useState, useMemo } from 'react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import produce from 'immer';
import { PrimaryButton, registerIcons, Spinner, Stack } from '@fluentui/react';
import { IMuteFieldBase, IRow } from '../../../interfaces';
import { DataSourceTag } from '../../../utils/storage';
import useAsyncState from '../../../hooks/use-async-state';
import useCachedState from '../../../hooks/use-cached-state';
import { notify } from '../../../components/error';
import { logDataImport } from '../../../loggers/dataImport';
import { rawData2DataWithBaseMetas } from '../../dataSource/utils';
import databaseOptions from './options';
import type { SupportedDatabaseType } from './interfaces';
import { checkServerConnection } from './service';
import AdvancedOptions from './form/advanced-options';
import ConnectOptions from './form/connect-options';
import QueryOptions, { QueryOptionsHandlerRef } from './form/query-options';

export const StackTokens = {
    childrenGap: 20,
};

const iconPathPrefix = '/assets/icons/';

registerIcons({
    icons: Object.fromEntries(
        databaseOptions.map<[string, JSX.Element]>(opt => [
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
            ) : (<></>)
        ])
    ),
});

export type TableLabels = {
    key: string;
    colIndex: number;
    dataType: string | null;
}[];

type TableRowItem<TL extends TableLabels> = {
    [key in keyof TL]: any
};

export interface TableData<TL extends TableLabels = TableLabels> {
    meta: TL;
    columns: TL[number]['key'][];
    rows: TableRowItem<TL>[];
}

interface DatabaseDataProps {
    onClose: () => void;
    onDataLoaded: (fields: IMuteFieldBase[], dataSource: IRow[], name: string, tag: DataSourceTag) => void;
}

export const inputWidth = '180px';

export const defaultServers: readonly string[] = [
    "/connector",
    'https://gateway.kanaries.net/connector',
];

const MAX_SERVER_COUNT = 5;

const DatabaseConnector: FC<DatabaseDataProps> = ({ onClose, onDataLoaded }) => {
    const [serversRaw, setServers] = useCachedState<string>('database_connector_server', '[]');
    const servers = useMemo<string[]>(() => {
        try {
            const list = JSON.parse(serversRaw);
            if (!Array.isArray(list) || list.some(s => typeof s !== 'string')) {
                return [];
            }
            return list as string[];
        } catch (e) {
            return [];
        }
    }, [serversRaw]);
    const [serverList, setServerList] = useAsyncState<{ target: string; status: 'unknown' | 'pending' | 'fulfilled' | 'rejected'; lag: number }[]>(
        () => [...servers, ...defaultServers].map(target => ({ target, status: 'unknown', lag: 0 })),
        {
            resetBeforeTask: false,
        },
    );
    useEffect(() => {
        if (servers.length > MAX_SERVER_COUNT) {
            setServers(JSON.stringify(servers.slice(0, MAX_SERVER_COUNT)));
        }
    }, [servers, setServers]);
    
    const [server, setServer] = useState(servers.at(0) ?? defaultServers[0]);

    const curServer = serverList.find(s => s.target === server);
    
    const [sourceType, setSourceType] = useState<SupportedDatabaseType>('clickhouse');

    const [connectUri, setConnectUri] = useState('');
    const [credentials, setCredentials] = useState<Record<string, string>>({});
    const [queryString, setQueryString] = useState('');
    const [editorPreview, setEditorPreview, isEditorPreviewPending] = useAsyncState<{
        name: string;
        value: TableData;
    } | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        setQueryString('');
    }, [connectUri, sourceType]);

    const submit = async (
        name: string = editorPreview?.name ?? '',
        value: TableData | null = editorPreview?.value ?? null
    ) => {
        if (!value || submitting) {
            return;
        }
        setSubmitting(true);
        try {
            const { rows, columns } = value;
            const data = await rawData2DataWithBaseMetas(
                rows.map(
                    row => Object.fromEntries(
                        row.map<[string, any]>((val, colIdx) => [columns?.[colIdx] ?? `${colIdx}`, val])
                    )
                )
            );
            const { dataSource, fields } = data;

            logDataImport({
                dataType: `Database/${sourceType}`,
                name,
                fields,
                dataSource: dataSource.slice(0, 10),
                size: dataSource.length,
            });
            onDataLoaded(fields, dataSource, name, DataSourceTag.DATABASE);

            onClose();
        } catch (error) {
            notify({
                title: 'Failed to load.',
                type: 'error',
                content: `${error}`,
            });
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const updateServersList = (next: readonly string[]) => {
        setServers(JSON.stringify(next.filter(s => !defaultServers.includes(s))));
        setServerList(list => next.map(target => {
            const prev = list.find(which => which.target === target);
            return {
                target,
                status: prev?.status ?? 'unknown',
                lag: prev?.lag ?? 0,
            };
        }));
    };

    const testConnector = useCallback((...indices: number[]): void => {
        setServerList(prev => produce(prev, draft => {
            for (const idx of indices) {
                draft[idx].status = 'pending';
            }
        }));
        setServerList(
            prev => Promise.all(
                indices.map(
                    idx => prev[idx].target
                ).map(
                    target => checkServerConnection(target).then<typeof prev[number]>(
                        status => ({
                            target,
                            status: status !== false ? 'fulfilled' : 'rejected',
                            lag: status !== false ? status : 0,
                        })
                    )
                )
            ).then<typeof prev>(data => {
                return prev.map(d => {
                    const next = data.find(which => which.target === d.target);
                    return next ?? d;
                });
            }),
        );
    }, [setServerList]);

    const queryOptionsHandlerRef = useRef<QueryOptionsHandlerRef>(null);

    const [showQueryForm, setShowQueryForm] = useState(false);

    const markAsReady = (forceReload: boolean) => {
        if (showQueryForm) {
            if (forceReload) {
                queryOptionsHandlerRef.current?.reload();
            }
            return;
        }
        setShowQueryForm(true);
        queryOptionsHandlerRef.current?.reload();
    };

    return (
        <Stack tokens={StackTokens} style={{ paddingBlock: '1em', flexGrow: 1 }}>
            <AdvancedOptions
                servers={serverList}
                appendServer={target => {
                    const next = produce(serverList.map(s => s.target), draft => {
                        draft.unshift(target);
                    });
                    updateServersList(next);
                }}
                removeServer={idx => {
                    const next = produce(serverList.map(s => s.target), draft => {
                        draft.splice(idx, 1);
                    });
                    updateServersList(next);
                }}
                server={server}
                setServer={val => setServer(val)}
                testConnector={testConnector}
            />
            <ConnectOptions
                disabled={curServer?.status !== 'fulfilled'}
                sourceType={sourceType}
                setSourceType={setSourceType}
                connectUri={connectUri}
                setConnectUri={setConnectUri}
                credentials={credentials}
                setCredentials={setCredentials}
                nextStepEnabled={showQueryForm}
                markAsReady={markAsReady}
            />
            <QueryOptions
                ready={showQueryForm}
                disabled={curServer?.status !== 'fulfilled' || (sourceType !== 'demo' && !connectUri)}
                server={server}
                connectUri={connectUri}
                sourceType={sourceType}
                queryString={queryString}
                setQueryString={setQueryString}
                editorPreview={editorPreview}
                setEditorPreview={setEditorPreview}
                isEditorPreviewPending={isEditorPreviewPending}
                credentials={credentials}
                submit={submit}
                ref={queryOptionsHandlerRef}
            >
                {editorPreview && (
                    <Stack horizontal horizontalAlign="end">
                        <PrimaryButton
                            onClick={() => submit()}
                            disabled={submitting}
                        >
                            {submitting ? <Spinner /> : intl.get('common.apply')}
                        </PrimaryButton>
                    </Stack>
                )}
            </QueryOptions>
        </Stack>
    );
};


export default observer(DatabaseConnector);
