import intl from 'react-intl-universal';
import { FC, useEffect, useId, useMemo, useState, useRef, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import produce from 'immer';
import { RathIcon } from '../../../../components/icons';
import { RathSelect } from '../../../../components/rath-ui/rath-select';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Popover, PopoverAnchor, PopoverContent } from '../../../../components/ui/popover';
import { Textarea } from '../../../../components/ui/textarea';
import databaseOptions from '../options';
import type { SupportedDatabaseType } from '../interfaces';
import { renderDropdownItem, renderDropdownTitle } from '../dropdown';
import useCachedState from '../../../../hooks/use-cached-state';

const Form = styled.div`
    display: grid;
    grid-template-columns: max-content 1fr;
    column-gap: 0.5em;
    row-gap: 0.4em;
`;

const FlexingInput = styled(Input)`
    flex-grow: 1;
    flex-shrink: 1;
    border-radius: 0 4px 4px 0;
`;

const ConnectUriField = styled(FlexingInput)`
    position: relative;
`;

const CredentialsTextArea = styled(Textarea)`
    flex-grow: 1;
    flex-shrink: 1;
    min-height: 10em;
`;

const UriStorageKey = '__connect_uri__';
const MAX_STORE_SIZE = 10;

interface ConnectOptionsProps {
    disabled: boolean;
    sourceType: SupportedDatabaseType;
    setSourceType: (st: SupportedDatabaseType) => void;
    connectUri: string;
    setConnectUri: (val: string) => void;
    credentials: Record<string, string>;
    setCredentials: (data: Record<string, string>) => void;
    nextStepEnabled: boolean;
    markAsReady: (forceReload: boolean) => void;
}

const ConnectOptions: FC<ConnectOptionsProps> = ({
    disabled,
    sourceType,
    setSourceType,
    connectUri,
    setConnectUri,
    credentials,
    setCredentials,
    nextStepEnabled,
    markAsReady,
}) => {
    const databaseConfig = useMemo(() => {
        return databaseOptions.find((which) => which.key === sourceType);
    }, [sourceType]);

    useEffect(() => {
        setConnectUri('');
    }, [sourceType, setConnectUri]);

    const [credentialsRaw, setCredentialsRaw] = useState('');

    const reset = useCallback(() => {
        setCredentialsRaw(JSON.stringify(credentials, undefined, 4));
    }, [credentials]);

    useEffect(() => {
        reset();
    }, [reset]);

    const submitCredentials = (): boolean => {
        try {
            const obj = JSON.parse(credentialsRaw);
            if (typeof obj === 'object') {
                setCredentials(obj);
                return true;
            } else {
                reset();
                return false;
            }
        } catch {
            reset();
            return false;
        }
    };

    const uriInputId = `connect-uri-${useId().replace(/:/g, '')}`;

    const [storedUriRaw, setStoredUri] = useCachedState<string>(UriStorageKey, '{}');
    const storedUri = useMemo(() => {
        try {
            return JSON.parse(storedUriRaw) as Partial<Record<string, string[]>>;
        } catch {
            return {};
        }
    }, [storedUriRaw]);

    const storedList = storedUri[sourceType] ?? [];

    const [showAutoCompletion, setShowAutoCompletion] = useState(false);

    useEffect(() => {
        if (showAutoCompletion) {
            document.getElementById(uriInputId)?.focus();
        }
    }, [showAutoCompletion, uriInputId]);

    const markAsReadyRef = useRef(markAsReady);
    markAsReadyRef.current = markAsReady;

    useEffect(() => {
        if (sourceType === 'demo') {
            markAsReadyRef.current(false);
        }
    }, [sourceType, markAsReady]);

    const submit = () => {
        if (!sourceType) {
            return;
        }
        if (sourceType !== 'demo' && !connectUri) {
            return;
        }
        markAsReady(true);
        setStoredUri(
            JSON.stringify(
                produce(storedUri, (draft) => {
                    if (!(sourceType in draft)) {
                        draft[sourceType] = [];
                    }
                    if (!draft[sourceType]!.includes(connectUri)) {
                        draft[sourceType]!.unshift(connectUri);
                    }
                    draft[sourceType] = draft[sourceType]!.slice(0, MAX_STORE_SIZE);
                })
            )
        );
    };

    const autoCompletionItems = storedList.map((content) => ({
        key: content,
        text: content,
        onClick: () => {
            setConnectUri(content);
            setShowAutoCompletion(false);
        },
    }));

    const deleteStoreItem = (key: string) => {
        setStoredUri(
            JSON.stringify(
                produce(storedUri, (draft) => {
                    draft[sourceType] = (draft[sourceType] ?? []).filter((data) => data !== key);
                })
            )
        );
    };

    return (
        <>
            <Form>
                <Label aria-disabled={disabled} className={disabled ? 'opacity-50' : undefined}>
                    {intl.get('dataSource.connectUri')}
                </Label>
                <div className="flex min-w-0 items-center gap-2">
                    <RathSelect
                        ariaLabel={intl.get('dataSource.databaseType')}
                        className="w-[13.6em] shrink-0"
                        triggerClassName="rounded-r-none"
                        disabled={disabled}
                        options={databaseOptions}
                        selectedKey={sourceType}
                        renderItem={(option) => renderDropdownItem(option as typeof databaseOptions[number])}
                        renderValue={(option) => renderDropdownTitle(option ? [option as typeof databaseOptions[number]] : undefined)}
                        onChange={(key) => {
                            setSourceType(key as SupportedDatabaseType);
                        }}
                    />
                    <Popover open={showAutoCompletion} onOpenChange={setShowAutoCompletion}>
                        <PopoverAnchor asChild>
                            <div className="flex flex-1">
                                <ConnectUriField
                                    id={uriInputId}
                                    title={intl.get('dataSource.connectUri')}
                                    aria-required
                                    disabled={disabled || !databaseConfig || databaseConfig.key === 'demo'}
                                    value={connectUri}
                                    placeholder={databaseConfig?.rule}
                                    onChange={(event) => setConnectUri(event.target.value)}
                                    autoComplete="off"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowAutoCompletion(true);
                                    }}
                                />
                            </div>
                        </PopoverAnchor>
                        {autoCompletionItems.length > 0 && (
                            <PopoverContent
                                align="start"
                                className="w-[var(--radix-popover-trigger-width)] p-1"
                                onClick={(e) => e.stopPropagation()}
                                onOpenAutoFocus={(e) => e.preventDefault()}
                            >
                                <div role="listbox">
                                    {autoCompletionItems.map((item) => (
                                        <div key={item.key} className="flex items-center rounded-xs hover:bg-accent">
                                            <button
                                                type="button"
                                                role="option"
                                                aria-selected={item.key === connectUri}
                                                className="min-w-0 flex-1 truncate px-2 py-1.5 text-left text-sm"
                                                onClick={() => item.onClick()}
                                            >
                                                {item.text}
                                            </button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 shrink-0"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteStoreItem(item.key);
                                                }}
                                            >
                                                <RathIcon name="ChromeClose" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </PopoverContent>
                        )}
                    </Popover>
                    <Button
                        type="button"
                        variant={nextStepEnabled ? 'outline' : 'default'}
                        disabled={sourceType !== 'demo' && !connectUri}
                        onClick={submit}
                    >
                        {intl.get('common.submit')}
                    </Button>
                </div>
            </Form>
            {databaseConfig?.credentials === 'json' && (
                <CredentialsTextArea
                    autoComplete="false"
                    title="Credentials (JSON)"
                    required
                    aria-required
                    value={credentialsRaw}
                    placeholder="{}"
                    onChange={(event) => setCredentialsRaw(event.target.value)}
                    onBlur={() => {
                        submitCredentials();
                    }}
                />
            )}
        </>
    );
};

export default observer(ConnectOptions);
