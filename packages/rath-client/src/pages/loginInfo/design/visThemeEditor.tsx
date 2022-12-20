import { useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { debounce } from 'vega';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import MonacoEditor, { ChangeHandler } from 'react-monaco-editor';
import { ActionButton, MessageBar, MessageBarType, Stack } from '@fluentui/react';
import { useGlobalStore } from '../../../store';

const Cont = styled.div`
    margin-top: 1em;
    .hint-container {
        height: 2em;
    }
`;

const VisThemeEditor: React.FC = (props) => {
    const { commonStore } = useGlobalStore();
    const { customThemeConfig, vizTheme } = commonStore;
    const [isValidConfig, setIsValidConfig] = useState<boolean>(true);
    const options = {
        selectOnLineNumbers: true,
    };
    const onValueChange: ChangeHandler = debounce<ChangeHandler>(200, (newValue, e) => {
        let data = undefined;
        try {
            data = JSON.parse(newValue);
            commonStore.setCustomThemeConfig(data);
            setIsValidConfig(true);
        } catch (error) {
            setIsValidConfig(false);
        }
    });
    const code = useMemo(() => {
        if (typeof customThemeConfig === 'undefined') {
            return '{\n}';
        }
        return JSON.stringify(customThemeConfig, null, 2);
    }, [customThemeConfig]);
    return (
        <Cont>
            <Stack horizontal>
                <ActionButton
                    iconProps={{ iconName: 'Copy' }}
                    text={intl.get('login.design.syncFromSelectedTheme')}
                    onClick={() => {
                        commonStore.resetCustomThemeConfigByThemeKey(vizTheme);
                    }}
                />
            </Stack>
            <div className="hint-container">
                {!isValidConfig && <MessageBar messageBarType={MessageBarType.error}>Not valid json format.</MessageBar>}
            </div>
            <MonacoEditor width="400" height="300" language="json" theme="vs" value={code} options={options} onChange={onValueChange} />
        </Cont>
    );
};

export default observer(VisThemeEditor);
