import intl from 'react-intl-universal';
import { FC, useEffect, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import { Dropdown, IDropdownOption, Label, Stack, TextField } from '@fluentui/react';
import databaseOptions from '../config';
import type { SupportedDatabaseType } from '../type';
import { renderDropdownItem, renderDropdownTitle } from '../components/custom-dropdown';


const Form = styled.div`
    display: grid;
    grid-template-columns: max-content 1fr;
    column-gap: 0.5em;
    row-gap: 0.4em;
    & :nth-child(3n) {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }
`;

interface ConnectOptionsProps {
    disabled: boolean;
    sourceType: SupportedDatabaseType;
    setSourceType: (st: SupportedDatabaseType) => void;
    connectUri: string;
    setConnectUri: (val: string) => void;
}

const ConnectOptions: FC<ConnectOptionsProps> = ({
    disabled, sourceType, setSourceType, connectUri, setConnectUri,
}) => {
    const databaseConfig = useMemo(() => {
        return databaseOptions.find(which => which.key === sourceType);
    }, [sourceType]);

    useEffect(() => {
        setConnectUri('');
    }, [sourceType, setConnectUri]);

    return (
        <Form>
            <Label disabled={disabled} required>{intl.get('dataSource.connectUri')}</Label>
            <Stack horizontal>
                <Dropdown
                    title={intl.get('dataSource.databaseType')}
                    ariaLabel={intl.get('dataSource.databaseType')}
                    disabled={disabled}
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
                    disabled={disabled || !databaseConfig || databaseConfig.key === 'demo'}
                    value={connectUri}
                    placeholder={databaseConfig?.rule}
                    onChange={(_, uri) => setConnectUri(uri ?? '')}
                    styles={{
                        root: {
                            position: 'relative',
                            flexGrow: 1,
                            flexShrink: 1,
                        },
                        fieldGroup: {
                            borderLeft: 'none',
                            borderRadius: '0 4px 4px 0',
                        },
                    }}
                />
            </Stack>
        </Form>
    );
};


export default observer(ConnectOptions);
