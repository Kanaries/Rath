import intl from 'react-intl-universal';
import { FC, ComponentPropsWithRef, useEffect, useMemo, useState, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import produce from 'immer';
import { DefaultButton, Dropdown, IDropdownOption, Label, PrimaryButton, Stack, TextField } from '@fluentui/react';
import databaseOptions from '../config';
import type { SupportedDatabaseType } from '../type';
import { renderDropdownItem, renderDropdownTitle } from '../custom-dropdown';
import useLocalStorage from '../../../../../hooks/use-local-storage';


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

    const uriInputName = databaseConfig ? `connectUri:${databaseConfig.key}` : undefined;

    const [storedUri, setStoredUri] = useLocalStorage<Partial<Record<string, string[]>>>(UriStorageKey, {});

    const storedListRef = useRef<string[]>([]);
    storedListRef.current = storedUri[sourceType] ?? [];

    const setConnectUriRef = useRef(setConnectUri);
    setConnectUriRef.current = setConnectUri;

    useEffect(() => {
        if (!sourceType) {
            return;
        }
        const [latestRecord] = storedListRef.current;
        if (latestRecord) {
            setConnectUriRef.current(latestRecord);
        }
    }, [sourceType, storedUri]);

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

    return (
        <>
            <Form>
                <Label disabled={disabled} required>{intl.get('dataSource.connectUri')}</Label>
                <Stack horizontal>
                    <Dropdown
                        title={intl.get('dataSource.databaseType')}
                        ariaLabel={intl.get('dataSource.databaseType')}
                        disabled={disabled}
                        required
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
                        name={uriInputName}
                        title={intl.get('dataSource.connectUri')}
                        aria-required
                        disabled={disabled || !databaseConfig || databaseConfig.key === 'demo'}
                        value={connectUri}
                        placeholder={databaseConfig?.rule}
                        onChange={(_, uri) => setConnectUri(uri ?? '')}
                        autoComplete="off"
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
