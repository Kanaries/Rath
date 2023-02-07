import { FC, useCallback, useState } from 'react';
import { observer } from 'mobx-react-lite';
import produce from 'immer';
import { registerIcons, Stack } from '@fluentui/react';
import type { IMuteFieldBase, IRow } from '../../../../interfaces';
import { DataSourceTag } from '../../../../utils/storage';
import useAsyncState from '../../../../hooks/use-async-state';
import useLocalStorage from '../../../../hooks/use-local-storage';
import databaseOptions from './config';
import type { SupportedDatabaseType } from './type';
import { checkServerConnection } from './api';
import AdvancedOptions from './form/advanced-options';
import ConnectOptions from './form/connect-options';
import QueryOptions from './form/query-options';

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
    columns: TL;
    rows: TableRowItem<TL>[];
}

interface DatabaseDataProps {
    onClose: () => void;
    onDataLoaded: (fields: IMuteFieldBase[], dataSource: IRow[], name: string, tag: DataSourceTag) => void;
    setLoadingAnimation: (on: boolean) => void;
}

export const inputWidth = '180px';

// FIXME: test server
export const defaultServers: readonly string[] = [
    'https://za2piuk6wc.execute-api.us-east-1.amazonaws.com/connector',
    'https://2qqrotf58e.execute-api.ap-northeast-1.amazonaws.com/connector',
    'https://gateway.kanaries.net/connector',
];


const DatabaseConnector: FC<DatabaseDataProps> = ({ onClose, onDataLoaded, setLoadingAnimation }) => {
    const [servers, setServers] = useLocalStorage('database_connector_server', defaultServers);
    const [serverList, setServerList] = useAsyncState<{ target: string; status: 'unknown' | 'pending' | 'fulfilled' | 'rejected'; lag: number }[]>(
        () => servers.map(target => ({ target, status: 'unknown', lag: 0 })),
        {
            resetBeforeTask: false,
        },
    );
    
    const [server, setServer] = useState(servers.at(0) ?? defaultServers[0]);

    const curServer = serverList.find(s => s.target === server);
    
    const [sourceType, setSourceType] = useState<SupportedDatabaseType>('clickhouse');

    const [connectUri, setConnectUri] = useState('');

    // const submit = async () => {
    //     // if (!preview.value || submitPendingRef.current) {
    //     //     return;
    //     // }
    //     // submitPendingRef.current = true;
    //     // try {
    //     //     const { rows, columns } = preview.value;
    //     //     const data = await rawData2DataWithBaseMetas(
    //     //         rows.map(
    //     //             row => Object.fromEntries(
    //     //                 row.map<[string, any]>((val, colIdx) => [columns?.[colIdx]?.key ?? `${colIdx}`, val])
    //     //             )
    //     //         )
    //     //     );
    //     //     const { dataSource, fields } = data;
    //     //     const name = [database.value, schema.value].filter(
    //     //         Boolean
    //     //     ).join('.')

    //     //     logDataImport({
    //     //         dataType: `Database/${databaseType}`,
    //     //         name,
    //     //         fields,
    //     //         dataSource: dataSource.slice(0, 10),
    //     //         size: dataSource.length,
    //     //     });
    //     //     onDataLoaded(fields, dataSource, name, DataSourceTag.DATABASE);

    //     //     onClose();
    //     // } catch (error) {
    //     //     console.error(error);
    //     // } finally {
    //     //     submitPendingRef.current = false;
    //     // }
    // };

    const updateServersList = (next: readonly string[]) => {
        setServers(next);
        setServerList(next.map(target => {
            const prev = serverList.find(which => which.target === target);
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

    return (
        <Stack tokens={StackTokens} style={{ paddingBlock: '1em' }}>
            <AdvancedOptions
                servers={serverList}
                appendServer={target => {
                    const next = produce(servers, draft => {
                        draft.unshift(target);
                    });
                    updateServersList(next);
                }}
                removeServer={idx => {
                    const next = produce(servers, draft => {
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
            />
            <QueryOptions
                disabled={curServer?.status !== 'fulfilled' || !connectUri}
                server={server}
                connectUri={connectUri}
                sourceType={sourceType}
            />
        </Stack>
    );
};


export default observer(DatabaseConnector);
