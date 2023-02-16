import intl from 'react-intl-universal';
import { FC, ComponentPropsWithRef, useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import produce from 'immer';
import { useId } from '@fluentui/react-hooks';
import { ContextualMenu, DefaultButton, Dropdown, Icon, IContextualMenuItem, IDropdownOption, Label, PrimaryButton, Stack, TextField } from '@fluentui/react';
import databaseOptions from '../config';
import type { SupportedDatabaseType } from '../type';
import { renderDropdownItem, renderDropdownTitle } from '../custom-dropdown';
import useLocalStorage from '../../../../../hooks/use-local-storage';


const InputGroupStackToken = { childrenGap: 10 };

const Form = styled.div`
    display: grid;
    grid-template-columns: max-content 1fr;
    column-gap: 0.5em;
    row-gap: 0.4em;
`;

const FlexingTextField = styled(TextField)`
    flex-grow: 1;
    flex-shrink: 1;
    .ms-TextField-fieldGroup {
        border-radius: 0 4px 4px 0;
    }
`;

const ConnectUriField = styled(FlexingTextField)`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    .ms-TextField-wrapper {
        width: 100%;
    }
    .ms-TextField-fieldGroup {
        border-radius: 0 4px 4px 0;
    }
`;

const DatabaseDropdownStyles: ComponentPropsWithRef<typeof Dropdown>['styles'] = {
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
};

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
    markAsReady: () => void;
}

const MenuItem = styled.div`
    position: relative;
    i {
        cursor: pointer;
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
    }
`;

const onRenderContextualMenuItem = (
    item: IContextualMenuItem | undefined,
    onDelete: (key: string) => void,
    defaultRenderer: ((props?: IContextualMenuItem | undefined) => JSX.Element | null) | undefined,
): JSX.Element => {
    if (!item) {
        return <></>;
    }
    return (
        <MenuItem>
            {defaultRenderer?.(item)}
            <Icon
                iconName="ChromeClose"
                role="button"
                tabIndex={0}
                onClick={() => onDelete(item.key)}
            />
        </MenuItem>
    );
};

const ConnectOptions: FC<ConnectOptionsProps> = ({
    disabled, sourceType, setSourceType, connectUri, setConnectUri, credentials, setCredentials, nextStepEnabled, markAsReady,
}) => {
    const databaseConfig = useMemo(() => {
        return databaseOptions.find(which => which.key === sourceType);
    }, [sourceType]);

    useEffect(() => {
        setConnectUri('');
    }, [sourceType, setConnectUri]);

    const [credentialsRaw, setCredentialsRaw] = useState('');

    useEffect(() => {
        setCredentialsRaw(JSON.stringify(credentials, undefined, 4));
    }, [credentials]);

    const submitCredentials = (): boolean => {
        try {
            const obj = JSON.parse(credentialsRaw);
            if (typeof obj === 'object') {
                setCredentials(obj);
                return true;
            } else {
                return false;
            }
        } catch {
            return false;
        }
    };

    const uriInputId = useId();

    const [storedUri, setStoredUri] = useLocalStorage<Partial<Record<string, string[]>>>(UriStorageKey, {});

    const storedList = storedUri[sourceType] ?? [];

    const [showAutoCompletion, setShowAutoCompletion] = useState(false);

    useEffect(() => {
        if (showAutoCompletion) {
            document.getElementById(uriInputId)?.focus();
            const clickOutsideToDismiss = () => {
                setShowAutoCompletion(false);
            };
            document.body.addEventListener('click', clickOutsideToDismiss);
            return () => {
                document.body.removeEventListener('click', clickOutsideToDismiss);
            };
        }
    }, [showAutoCompletion, uriInputId]);
    
    const submit = () => {
        if (!sourceType || !connectUri) {
            return;
        }
        markAsReady();
        setStoredUri(produce(storedUri, draft => {
            if (!(sourceType in draft)) {
                draft[sourceType] = [];
            }
            if (!draft[sourceType]!.includes(connectUri)) {
                draft[sourceType]!.unshift(connectUri);
            }
            draft[sourceType] = draft[sourceType]!.slice(0, MAX_STORE_SIZE);
        }));
    };

    const SubmitButton = nextStepEnabled ? DefaultButton : PrimaryButton;

    const autoCompletionItems = storedList.map(content => ({
        key: content,
        text: content,
        onClick: () => {
            setConnectUri(content);
            setShowAutoCompletion(false);
        },
    }));

    const deleteStoreItem = (key: string) => {
        setStoredUri(produce(storedUri, draft => {
            draft[sourceType] = (draft[sourceType] ?? []).filter(data => data !== key);
        }));
    };

    return (
        <>
            <Form>
                <Label disabled={disabled} required>{intl.get('dataSource.connectUri')}</Label>
                <Stack horizontal tokens={InputGroupStackToken}>
                    <Dropdown
                        title={intl.get('dataSource.databaseType')}
                        ariaLabel={intl.get('dataSource.databaseType')}
                        disabled={disabled}
                        styles={DatabaseDropdownStyles}
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
                    <ConnectUriField
                        id={uriInputId}
                        title={intl.get('dataSource.connectUri')}
                        aria-required
                        disabled={disabled || !databaseConfig || databaseConfig.key === 'demo'}
                        value={connectUri}
                        placeholder={databaseConfig?.rule}
                        onChange={(_, uri) => setConnectUri(uri ?? '')}
                        autoComplete="off"
                        onClick={e => {
                            e.stopPropagation();
                            setShowAutoCompletion(true);
                        }}
                    />
                    <ContextualMenu
                        target={`#${uriInputId}`}
                        useTargetWidth
                        hidden={!showAutoCompletion}
                        items={autoCompletionItems}
                        onRenderContextualMenuItem={(item, defaultRenderer) => onRenderContextualMenuItem(item, deleteStoreItem, defaultRenderer)}
                        shouldFocusOnMount={false}
                    />
                    <SubmitButton disabled={!connectUri} text={intl.get('common.submit')} onClick={submit} />
                </Stack>
            </Form>
            {databaseConfig?.credentials === 'json' && (
                <Stack horizontal verticalAlign="end">
                    <FlexingTextField
                        multiline
                        autoComplete="false"
                        title="Credentials"
                        label="Credentials"
                        required
                        aria-required
                        value={credentialsRaw}
                        placeholder="{}"
                        onChange={(_, content) => setCredentialsRaw(content ?? '')}
                    />
                    <DefaultButton
                        text={intl.get('common.apply')}
                        onClick={() => submitCredentials()}
                    />
                </Stack>
            )}
        </>
    );
};


export default observer(ConnectOptions);
