import type { FC } from 'react';
import { DefaultButton, Dropdown, IDropdownOption, PrimaryButton, Stack, TextField } from '@fluentui/react';
import intl from 'react-intl-universal';
import datasetOptions from './config';
import { renderDropdownItem, renderDropdownTitle } from './custom-dropdown';
import type { DatabaseOptions, SupportedDatabaseType } from './type';
import { StackTokens } from '.';

interface ConnectFormProps {
    sourceType: SupportedDatabaseType;
    setSourceType: (sType: SupportedDatabaseType) => void;
    whichDatabase: typeof datasetOptions[0];
    sourceId: DatabaseOptions['sourceId'];
    connectUri: DatabaseOptions['connectUri'];
    setConnectUri: (uri: string) => void;
    handleConnectionTest: () => Promise<void>;
}

const ConnectForm: FC<ConnectFormProps> = ({
    sourceType,
    setSourceType,
    whichDatabase,
    sourceId,
    connectUri,
    setConnectUri,
    handleConnectionTest,
}) => {
    return (
        <Stack horizontal style={{ alignItems: 'flex-end' }}>
            <Dropdown
                label={intl.get('dataSource.connectUri')}
                title={intl.get('dataSource.databaseType')}
                ariaLabel={intl.get('dataSource.databaseType')}
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
                options={datasetOptions}
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
                name={`connectUri:${whichDatabase.key}`}
                title={intl.get('dataSource.connectUri')}
                aria-required
                value={connectUri}
                placeholder={whichDatabase.rule}
                errorMessage={sourceId === null ? intl.get('dataSource.btn.connectFailed') : undefined}
                onChange={(_, uri) => {
                    setConnectUri(uri ?? '');
                }}
                onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                        handleConnectionTest();
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
                    // 如果错误信息被插入到下方，
                    // static 定位时会导致布局被向上顶开.
                    errorMessage: {
                        position: 'absolute',
                        paddingBlock: '5px',
                        paddingInlineStart: '1em',
                        bottom: '100%',
                    },
                }}
            />
            <PrimaryButton
                text={intl.get('dataSource.btn.connect')}
                disabled={!connectUri || sourceId.status !== 'empty'}
                onClick={handleConnectionTest}
            />
        </Stack>
    );
};

interface ConnectFormReadonlyProps {
    connectUri: string;
    resetConnectUri: () => void;
}

export const ConnectFormReadonly: FC<ConnectFormReadonlyProps> = ({ connectUri, resetConnectUri }) => {
    return (
        <Stack
            tokens={StackTokens}
            horizontal
            style={{
                marginBlockStart: '1.2em',
                marginBlockEnd: '0.8em',
                alignItems: 'center',
            }}
        >
            <TextField
                readOnly
                value={connectUri}
                tabIndex={-1}
                styles={{
                    root: {
                        flexGrow: 1,
                    },
                }}
            />
            <DefaultButton
                text={intl.get('dataSource.btn.reset')}
                style={{
                    marginInlineStart: '1em',
                    marginInlineEnd: '0',
                    paddingInline: '0.6em',
                    fontSize: '70%',
                }}
                onClick={resetConnectUri}
            />
        </Stack>
    );
};

export default ConnectForm;
