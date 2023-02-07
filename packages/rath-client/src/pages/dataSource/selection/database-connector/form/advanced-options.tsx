import intl from 'react-intl-universal';
import { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import {
    Icon,
    IconButton,
    TextField,
    Spinner,
    Stack,
    ContextualMenu,
    IContextualMenuItem,
    SpinnerSize,
    PrimaryButton,
    DefaultButton,
    Label,
} from "@fluentui/react";
import { useId } from '@fluentui/react-hooks';
import { observer } from "mobx-react-lite";
import { defaultServers } from '..';


const ErrorMessage = styled.span`
    color: red;
    font-size: 0.6rem;
`;

const ServerItem = styled.div`
    cursor: pointer;
    outline: none;
    user-select: none;
    padding: 4px 8px;
    :hover {
        background-color: #eee;
    }
    &[aria-checked="true"] {
        cursor: default;
        background-color: #f3f3f3;
    }
    & * {
        cursor: inherit;
    }
    display: flex;
    flex-direction: row;
    > * {
        padding: 4px;
        flex-grow: 1;
        flex-shrink: 1;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        :first-child {
            flex-grow: 0;
            flex-shrink: 0;
            align-items: center;
            width: 2.4em;
            font-size: 1.1rem;
        }
        :nth-child(2) span {
            display: inline-block;
            font-size: 0.7rem;
            min-width: 2em;
            width: max-content;
            text-align: center;
            color: #666;
        }
        :last-child {
            flex-grow: 0;
            flex-shrink: 0;
            flex-direction: row;
            cursor: unset;
            button {
                cursor: pointer;
                &[aria-disabled="true"] {
                    cursor: default;
                }
            }
        }
    }
`;

const renderServerItem = (
    onClick: (target: string) => void,
    onDelete: (target: string) => void,
    onRefresh: (target: string) => void,
    props: IContextualMenuItem | undefined,
): JSX.Element => {
    if (!props) {
        return <></>;
    }
    const { checked, key: target, text: status, secondaryText } = props as {
        checked: boolean;
        key: string;
        text: 'unknown' | 'pending' | 'fulfilled' | 'rejected';
        secondaryText: string;
    };
    const lag = Number(secondaryText);

    const isDefault = defaultServers.includes(target);
    const canDelete = status !== 'pending' && !isDefault;

    return (
        <ServerItem
            role="option"
            tabIndex={0}
            aria-checked={checked}
            onClick={e => {
                e.stopPropagation();
                onClick(target);
            }}
        >
            <div>
                {status === 'fulfilled' ? (
                    <Icon
                        iconName="StatusCircleCheckmark"
                        style={{
                            borderRadius: '50%',
                            color: 'green',
                        }}
                    />
                ) : status === 'rejected' ? (
                    <Icon
                        iconName="StatusCircleErrorX"
                        style={{
                            color: 'red',
                        }}
                    />
                ) : status === 'pending' && (
                    <Spinner size={SpinnerSize.small} style={{ margin: '3px 0' }} />
                )}
            </div>
            <div>
                <label>{target}</label>
                <span>{status === 'fulfilled' ? `${lag}ms` : '-'}</span>
            </div>
            <div onClick={e => e.stopPropagation()}>
                <IconButton
                    disabled={status === 'pending'}
                    iconProps={{ iconName: 'SyncOccurence' }}
                    onClick={() => onRefresh(target)}
                />
                <IconButton
                    disabled={!canDelete}
                    iconProps={{ iconName: 'Delete', style: { color: canDelete ? 'red' : undefined } }}
                    onClick={() => onDelete(target)}
                />
            </div>
        </ServerItem>
    );
};

const AdvancedOptions = observer<{
    servers: {
        target: string;
        status: 'unknown' | 'pending' | 'fulfilled' | 'rejected';
        lag: number;
    }[];
    appendServer: (target: string) => void;
    removeServer: (idx: number) => void;
    server: string;
    setServer: (target: string) => void;
    testConnector: (...indices: number[]) => void;
}>(function AdvancedOptions ({ servers, server, setServer, appendServer, removeServer, testConnector }) {
    useEffect(() => {
        const unchecked = servers.map((s, i) => ({ s, i })).filter(({ s }) => s.status === 'unknown').map(({ i }) => i);
        if (unchecked.length > 0) {
            testConnector(...unchecked);
        }
    }, [servers, testConnector]);

    const [focused, setFocused] = useState(false);

    const [customServer, setCustomServer] = useState('');

    useEffect(() => {
        setCustomServer(server);
    }, [server]);

    const id = useId();
    const [inputWidth, setInputWidth] = useState(400);

    const springRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = springRef.current;
        if (el) {
            setInputWidth(el.getBoundingClientRect().width);
            el.focus();
        }
    }, [id]);

    const items = useMemo<typeof servers>(() => {
        const letters = customServer.toLowerCase().replaceAll(/[^a-z0-9_.-]/g, '').split('');
        if (letters.length && server !== customServer) {
            const pattern = new RegExp(letters.join('.*'));
            return servers.filter(item => pattern.test(item.target));
        } else {
            return servers;
        }
    }, [servers, customServer, server]);

    const curServer = servers.find(s => s.target === server);
    const status = curServer?.status;

    const renderItem = renderServerItem.bind({},
        target => {
            setServer(target);
            setFocused(false);
        },
        target => {
            const idx = servers.findIndex(which => which.target === target);
            if (idx !== -1) {
                removeServer(idx);
            }
        },
        target => {
            const idx = servers.findIndex(which => which.target === target);
            if (idx !== -1) {
                testConnector(idx);
            }
        },
    );

    const isInputANewAddress = customServer && servers.every(s => s.target !== customServer);

    const submitCustomServer = () => {
        if (!isInputANewAddress) {
            return;
        }
        appendServer(customServer);
        setServer(customServer);
    };

    return (
        <Stack horizontal verticalAlign="end" onClick={() => setFocused(false)} style={{ position: 'relative' }}>
            <div aria-hidden ref={springRef} style={{ position: 'absolute', left: 0, top: 0, height: 0, width: '100%' }} />
            <TextField
                id={id}
                label={intl.get('dataSource.connectorService')}
                value={customServer}
                onClick={e => e.stopPropagation()}
                onKeyDown={e => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        submitCustomServer();
                    }
                }}
                onFocus={() => setFocused(true)}
                onChange={(_, val) => {
                    setCustomServer(val?.replaceAll(/\s+/g, '') ?? '');
                }}
                onRenderLabel={() => (
                    <Stack horizontal tokens={{ childrenGap: 20 }} verticalAlign="center">
                        <Label>{intl.get('dataSource.connectorService')}</Label>
                        {!status ? (
                            <ErrorMessage>
                                {intl.get('dataSource.connectorEmpty')}
                            </ErrorMessage>
                        ) : status === 'pending' ? (
                            <Spinner size={SpinnerSize.small} />
                        ) : status === 'fulfilled' ? (
                            <span style={{ display: 'flex', alignItems: 'center' }}>
                                <Icon
                                    iconName="StatusCircleCheckmark"
                                    style={{
                                        borderRadius: '50%',
                                        fontSize: '1.2rem',
                                        color: 'green',
                                        userSelect: 'none',
                                        cursor: 'default',
                                    }}
                                />
                                {curServer.lag && <small>{`${curServer.lag}ms`}</small>}
                            </span>
                        ) : (
                            <ErrorMessage>
                                {intl.get('dataSource.connectorOffline')}
                            </ErrorMessage>
                        )}
                    </Stack>
                )}
                onRenderSuffix={() => {
                    return (
                        <PrimaryButton
                            disabled={!isInputANewAddress}
                            iconProps={{ iconName: 'Add' }}
                            style={{ width: '32px', minWidth: 'unset', padding: '0' }}
                            onClick={submitCustomServer}
                        />
                    );
                }}
                autoComplete="off"
                styles={{ root: { flexGrow: 1 }, suffix: { padding: 0 } }}
            />
            {focused && (
                <>
                    <DefaultButton
                        iconProps={{ iconName: 'SyncOccurence' }}
                        style={{ width: '32px', minWidth: 'unset', padding: '0', borderLeft: 'none' }}
                        onClick={e => {
                            e.stopPropagation();
                            testConnector(...servers.map((_, i) => i));
                        }}
                    />
                    <DefaultButton
                        iconProps={{ iconName: 'CheckMark' }}
                        style={{ width: '32px', minWidth: 'unset', padding: '0', borderLeft: 'none' }}
                        onClick={() => setFocused(false)}
                    />
                </>
            )}
            <ContextualMenu
                target={`#${id}`}
                styles={{ root: { width: `${inputWidth}px`, display: focused ? undefined : 'none' } }}
                items={items.map(s => ({ key: s.target, secondaryText: `${s.lag}`, text: s.status, checked: s.target === server }))}
                onRenderContextualMenuItem={renderItem}
            />
        </Stack>
    );
});


export default AdvancedOptions;
