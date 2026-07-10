import intl from 'react-intl-universal';
import { useEffect, useId, useMemo, useState } from "react";
import styled from "styled-components";
import { observer } from "mobx-react-lite";
import { RathIcon } from '../../../../components/icons';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Popover, PopoverAnchor, PopoverContent } from '../../../../components/ui/popover';
import { Spinner } from '../../../../components/ui/spinner';
import { renderServerItem, ServerDropdownItem } from '../components/server-dropdown-item';


const ErrorMessage = styled.span`
    color: red;
    font-size: 0.6rem;
`;

const SuccessMessage = styled.span`
    display: flex;
    align-items: center;
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

    const id = `advanced-options-${useId().replace(/:/g, '')}`;

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
        <div className="flex items-center gap-5">
            <Label htmlFor={`${id}-input`} style={{ whiteSpace: 'nowrap' }}>{intl.get('dataSource.connectorService')}</Label>
            {!status && (
                <ErrorMessage>
                    {intl.get('dataSource.connectorEmpty')}
                </ErrorMessage>
            )}
            {status === 'pending' && <Spinner size="sm" />}
            {status === 'fulfilled' && curServer && (
                <SuccessMessage>
                    <RathIcon
                        name="StatusCircleCheckmark"
                        size={19}
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
        </div>
    );

    const options = useMemo<ServerDropdownItem[]>(() => {
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
            checked: false,
        }];
    }, [items, server])

    return (
        <Popover open={focused} onOpenChange={setFocused}>
            <PopoverAnchor asChild>
                <div className="relative flex items-end" onClick={() => setFocused(false)}>
                    <div className="flex flex-1 flex-col gap-1.5">
                        {renderLabel()}
                        <div className="flex">
                            <Input
                                id={`${id}-input`}
                                title={intl.get('dataSource.connectorService')}
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
                                onChange={(event) => {
                                    setCustomServer(event.target.value.replaceAll(/\s+/g, ''));
                                }}
                                autoComplete="off"
                                className="rounded-r-none"
                            />
                            <Button
                                type="button"
                                disabled={!isInputANewAddress}
                                className="h-8 w-8 rounded-l-none px-0"
                                onClick={submitCustomServer}
                            >
                                <RathIcon name="Add" />
                            </Button>
                        </div>
                    </div>
                    {focused && (
                        <>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-l-none"
                                onClick={e => {
                                    e.stopPropagation();
                                    testConnector(...servers.map((_, i) => i));
                                }}
                            >
                                <RathIcon name="SyncOccurence" />
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-l-none"
                                onClick={() => setFocused(false)}
                            >
                                <RathIcon name="CheckMark" />
                            </Button>
                        </>
                    )}
                </div>
            </PopoverAnchor>
            <PopoverContent
                align="start"
                className="w-[var(--radix-popover-trigger-width)] p-1"
                onClick={e => e.stopPropagation()}
                onOpenAutoFocus={e => e.preventDefault()}
            >
                <div role="listbox">
                    {options.map(option => (
                        <div key={option.key}>{renderItem(option)}</div>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
});


export default AdvancedOptions;
