import intl from 'react-intl-universal';
import { FC, useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import produce from 'immer';
import { Dropdown, IDropdownOption, PrimaryButton, registerIcons, Spinner, SpinnerSize, Stack, TextField } from '@fluentui/react';
import type { IMuteFieldBase, IRow } from '../../../../interfaces';
import { DataSourceTag } from '../../../../utils/storage';
import useAsyncState from '../../../../hooks/use-async-state';
import useLocalStorage from '../../../../hooks/use-local-storage';
import databaseOptions from './config';
import type { SupportedDatabaseType } from './type';
import { renderDropdownItem, renderDropdownTitle } from './custom-dropdown';
import { checkServerConnection } from './api';
import AdvancedOptions from './form/advanced-options';

export const StackTokens = {
    childrenGap: 10,
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

    // const initialServersRef = useRef(servers);

    // useEffect(() => {
    //     const list = initialServersRef.current;
    //     const state = list.map(target => checkServerConnection(target).then<typeof serverList[number]>(
    //         status => ({
    //             target,
    //             status: status !== false ? 'fulfilled' : 'rejected',
    //             lag: status !== false ? status : 0,
    //         })
    //     ));
    //     setServerList(Promise.all(state));
    // }, [setServerList]);

    const [server, setServer] = useState(servers.at(0) ?? defaultServers[0]);

    const serverStatusOk = serverList.find(s => s.target === server)?.status === 'fulfilled';
    
    const [sourceType, setSourceType] = useState<SupportedDatabaseType>('clickhouse');

    const databaseConfig = useMemo(() => {
        return databaseOptions.find(which => which.key === sourceType);
    }, [sourceType]);

    const [connectUri, setConnectUri] = useState('');

    useEffect(() => {
        setConnectUri('');
    }, [sourceType]);

    const [connected, setConnected, isConnecting] = useAsyncState(false);

    useEffect(() => {
        setConnected(false);
    }, [connectUri, setConnected]);

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

    return (
        <Stack tokens={StackTokens} style={{ paddingBlock: '1em' }}>
            <AdvancedOptions
                servers={serverList}
                appendServer={target => {
                    const next = produce(servers, draft => {
                        draft.unshift(target);
                    });
                    setServers(next);
                    setServerList(next.map(target => ({
                        target,
                        status: serverList.find(which => which.target === target)?.status ?? 'unknown',
                        lag: 0,
                    })));
                }}
                removeServer={idx => {
                    const next = produce(servers, draft => {
                        draft.splice(idx, 1);
                    });
                    setServers(next);
                    setServerList(next.map(target => ({
                        target,
                        status: serverList.find(which => which.target === target)?.status ?? 'unknown',
                        lag: 0,
                    })));
                }}
                server={server}
                setServer={val => setServer(val)}
                testConnector={(...indices) => {
                    setServerList(prev => produce(prev, draft => {
                        for (const idx of indices) {
                            draft[idx].status = 'pending';
                        }
                    }));
                    setServerList(
                        prev => Promise.all(
                            indices.map(
                                idx => serverList[idx].target
                            ).map(
                                target => checkServerConnection(target).then<typeof serverList[number]>(
                                    status => ({
                                        target,
                                        status: status !== false ? 'fulfilled' : 'rejected',
                                        lag: status !== false ? status : 0,
                                    })
                                )
                            )
                        ).then<typeof serverList>(data => {
                            return prev.map(d => {
                                const next = data.find(which => which.target === d.target);
                                return next ?? d;
                            });
                        }),
                    )
                }}
            />
            <Stack>
                <Dropdown
                    label={intl.get('dataSource.connectUri')}
                    title={intl.get('dataSource.databaseType')}
                    ariaLabel={intl.get('dataSource.databaseType')}
                    disabled={!serverStatusOk || isConnecting}
                    required
                    styles={{
                        dropdown: {
                            width: '13.6em',
                            borderRadius: '2px 0 0 2px',
                        },
                        dropdownItems: {
                            paddingBlockStart: '6px',
                            paddingBlockEnd: '6px',
                            maxHeight: '20vh',
                            overflowY: 'scroll',
                        },
                        dropdownItemSelected: {
                            position: 'static',
                            minHeight: '2.2em',
                        },
                        dropdownItem: {
                            position: 'static',
                            minHeight: '2.2em',
                        },
                    }}
                    options={databaseOptions}
                    selectedKey={sourceType}
                    onRenderOption={renderDropdownItem as (e?: IDropdownOption) => JSX.Element}
                    onRenderTitle={renderDropdownTitle as (e?: IDropdownOption[]) => JSX.Element}
                    onChange={(_, item) => {
                        if (item) {
                            setSourceType(item.key as SupportedDatabaseType);
                        }
                    }}
                />
                <TextField
                    name={databaseConfig ? `connectUri:${databaseConfig.key}` : undefined}
                    title={intl.get('dataSource.connectUri')}
                    aria-required
                    disabled={!serverStatusOk || !databaseConfig || isConnecting || databaseConfig.key === 'demo'}
                    value={connectUri}
                    placeholder={databaseConfig?.rule}
                    onChange={(_, uri) => setConnectUri(uri ?? '')}
                    onKeyPress={e => {
                        if (e.key === 'Enter' && connectUri && !isConnecting) {
                            // handleConnectionTest();
                        }
                    }}
                    styles={{
                        root: {
                            position: 'relative',
                            marginRight: '1em',
                            flexGrow: 1,
                            flexShrink: 1,
                        },
                        fieldGroup: {
                            borderLeft: 'none',
                            borderRadius: '0 4px 4px 0',
                        },
                    }}
                />
                <PrimaryButton
                    disabled={!serverStatusOk || isConnecting || (databaseConfig?.key !== 'demo' && !connectUri) || connected}
                    // onClick={() => handleConnectionTest()}
                >
                    {isConnecting ? <Spinner size={SpinnerSize.small} /> : intl.get('dataSource.btn.connect')}
                </PrimaryButton>
            </Stack>
        </Stack>
    );
};


export default observer(DatabaseConnector);
