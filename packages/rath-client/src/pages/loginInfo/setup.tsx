import React, { useState } from 'react';
import { Dropdown, IDropdownOption, Pivot, PivotItem, Stack } from '@fluentui/react';
import styled from 'styled-components';
import { observer } from 'mobx-react-lite';
import { SUPPORT_LANG } from '../../locales';
import { useGlobalStore } from '../../store';
import AnalysisSettings from '../../components/analysisSettings';
import { THEME_KEYS } from '../../queries/themes';

const langOptions: IDropdownOption[] = SUPPORT_LANG.map((lang) => ({
    key: lang.value,
    text: lang.name,
}));

const SetUpDiv = styled.div`
    padding: 0.5em 1em 1em 1em;
    hr {
        margin: 1em 0em;
    }
`;

const themeOptions: IDropdownOption[] = [
    { key: THEME_KEYS.default, text: 'Default' },
    { key: THEME_KEYS.googlecharts, text: 'Google Charts' },
    { key: THEME_KEYS.powerbi, text: 'PowerBI' },
    { key: THEME_KEYS.ggplot2, text: 'GGPlot2' },
    { key: THEME_KEYS.vox, text: 'Vox' }
]

function Setup() {
    const { langStore, commonStore } = useGlobalStore();
    const [configKey, setConfigKey] = useState<'basic' | 'analysis'>('basic');
    return (
        <SetUpDiv>
            <Pivot
                selectedKey={configKey}
                onLinkClick={(item) => {
                    if (item?.props.itemKey) {
                        setConfigKey(item.props.itemKey as 'basic' | 'analysis');
                    }
                }}
            >
                <PivotItem headerText="Basic" itemKey="basic"></PivotItem>
                <PivotItem headerText="Data Analysis" itemKey="analysis"></PivotItem>
            </Pivot>
            <hr />

            {configKey === 'basic' && (
                <Stack>
                    <Dropdown
                        label="Language"
                        selectedKey={langStore.lang}
                        options={langOptions}
                        onChange={(e, op) => {
                            op && langStore.changeLocalesAndReload(op.key as string);
                        }}
                    />
                    <Dropdown
                        options={themeOptions}
                        label="vis theme"
                        selectedKey={commonStore.vizTheme}
                        onChange={(e, op) => {
                            op && commonStore.applyPreBuildTheme(op.key as string)
                        }}
                    />
                </Stack>
            )}
            {configKey === 'analysis' && <AnalysisSettings />}
        </SetUpDiv>
    );
}

export default observer(Setup);
