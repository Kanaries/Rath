import intl from 'react-intl-universal';
import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import {
    Icon,
    TextField,
    Spinner,
    Stack,
    ContextualMenu,
    SpinnerSize,
    PrimaryButton,
    DefaultButton,
    Label,
    IContextualMenuItem,
} from "@fluentui/react";
import { useId } from '@fluentui/react-hooks';
import { observer } from "mobx-react-lite";
import { renderServerItem } from '../components/server-dropdown-item';


const ErrorMessage = styled.span`
    color: red;
    font-size: 0.6rem;
`;

const SuccessMessage = styled.span`
    display: flex;
    align-items: center;
`;

const SquaredDefaultButtonStyle = {
    width: '32px',
    minWidth: 'unset',
    padding: '0',
    borderLeft: 'none',
};

const AppendButtonStyle = {
    width: '32px',
    minWidth: 'unset',
    padding: '0',
};

const FlexibleTextFieldStyle = {
    root: {
        flex: 1,
    },
    suffix: {
        padding: 0
    },
};

const FullWidthMenuTarget = styled.div`
    position: absolute;
    height: 0;
    width: 100%;
`;

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

    const renderLabel = () => (
        <Stack horizontal tokens={{ childrenGap: 20 }} verticalAlign="center">
            <Label style={{ whiteSpace: 'nowrap' }}>{intl.get('dataSource.connectorService')}</Label>
            {!status && (
                <ErrorMessage>
                    {intl.get('dataSource.connectorEmpty')}
                </ErrorMessage>
            )}
            {status === 'pending' && <Spinner size={SpinnerSize.small} />}
            {status === 'fulfilled' && curServer && (
                <SuccessMessage>
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
                </SuccessMessage>
            )}
            {status === 'rejected' && (
                <ErrorMessage>
                    {intl.get('dataSource.connectorOffline')}
                </ErrorMessage>
            )}
        </Stack>
    );

    const renderSuffix = () => {
        return (
            <PrimaryButton
                disabled={!isInputANewAddress}
                iconProps={{ iconName: 'Add' }}
                style={AppendButtonStyle}
                onClick={submitCustomServer}
            />
        );
    };

    const options = useMemo<IContextualMenuItem[]>(() => {
        if (items.length > 0) {
            return items.map(s => ({
                key: s.target,
                secondaryText: `${s.lag}`,
                text: s.status,
                checked: s.target === server,
            }));
        }
        return [{
            key: 'new',
            text: 'new',
            secondaryText: intl.get('dataSource.btn.new_connector'),
        }];
    }, [items, server])

    return (
        <Stack horizontal verticalAlign="end" horizontalAlign="stretch" onClick={() => setFocused(false)} style={{ position: 'relative' }}>
            <TextField
                label={intl.get('dataSource.connectorService')}
                value={customServer}
                onClick={e => {
                    e.stopPropagation();
                    setFocused(true);
                }}
                onKeyDown={e => {
                    e.stopPropagation();
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        submitCustomServer();
                    }
                }}
                onChange={(_, val) => {
                    setCustomServer(val?.replaceAll(/\s+/g, '') ?? '');
                }}
                onRenderLabel={renderLabel}
                onRenderSuffix={renderSuffix}
                autoComplete="off"
                styles={FlexibleTextFieldStyle}
            />
            {focused && (
                <>
                    <DefaultButton
                        iconProps={{ iconName: 'SyncOccurence' }}
                        style={SquaredDefaultButtonStyle}
                        onClick={e => {
                            e.stopPropagation();
                            testConnector(...servers.map((_, i) => i));
                        }}
                    />
                    <DefaultButton
                        iconProps={{ iconName: 'CheckMark' }}
                        style={SquaredDefaultButtonStyle}
                        onClick={() => setFocused(false)}
                    />
                </>
            )}
            <FullWidthMenuTarget aria-hidden id={id} />
            <ContextualMenu
                target={`#${id}`}
                useTargetWidth
                hidden={!focused}
                items={options}
                onRenderContextualMenuItem={renderItem}
            />
        </Stack>
    );
});


export default AdvancedOptions;
