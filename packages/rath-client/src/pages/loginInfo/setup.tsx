import React, { useState } from 'react';
import { Dropdown, IDropdownOption, Pivot, PivotItem } from '@fluentui/react';
import styled from 'styled-components';
import { SUPPORT_LANG } from '../../locales';
import { useGlobalStore } from '../../store';
import AnalysisSettings from '../../components/analysisSettings';

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

function Setup() {
    const { langStore } = useGlobalStore();
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
                <div>
                    <Dropdown
                        label='Language'
                        selectedKey={langStore.lang}
                        options={langOptions}
                        onChange={(e, op) => {
                            op && langStore.changeLocalesAndReload(op.key as string);
                        }}
                    />
                </div>
            )}
            {configKey === 'analysis' && <AnalysisSettings />}
        </SetUpDiv>
    );
}

export default Setup;
