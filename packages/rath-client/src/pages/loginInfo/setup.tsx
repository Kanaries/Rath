import { useState } from 'react';
import { Dropdown, IDropdownOption, Pivot, PivotItem, Stack } from '@fluentui/react';
import styled from 'styled-components';
import { observer } from 'mobx-react-lite';
import intl from 'react-intl-universal';
import { SUPPORT_LANG } from '../../locales';
import { useGlobalStore } from '../../store';
import AnalysisSettings from '../../components/analysisSettings';
import DesignSegment from './design';

const langOptions: IDropdownOption[] = SUPPORT_LANG.map((lang) => ({
    key: lang.value,
    text: lang.name,
}));

const SetUpDiv = styled.div`
    hr {
        margin: 1em 0em;
    }
`;

enum CONFIG_KEY {
    basic = 'basic',
    analysis = 'analysis',
    design = 'design',
}

function Setup() {
    const { langStore } = useGlobalStore();
    const [configKey, setConfigKey] = useState<CONFIG_KEY>(CONFIG_KEY.basic);
    return (
        <SetUpDiv>
            <Pivot
                selectedKey={configKey}
                onLinkClick={(item) => {
                    if (item?.props.itemKey) {
                        setConfigKey(item.props.itemKey as CONFIG_KEY);
                    }
                }}
            >
                <PivotItem headerText={intl.get(`login.configKeys.${CONFIG_KEY.basic}`)} itemKey={CONFIG_KEY.basic}></PivotItem>
                <PivotItem headerText={intl.get(`login.configKeys.${CONFIG_KEY.design}`)} itemKey={CONFIG_KEY.design}></PivotItem>
                <PivotItem headerText={intl.get(`login.configKeys.${CONFIG_KEY.analysis}`)} itemKey={CONFIG_KEY.analysis}></PivotItem>
            </Pivot>
            <hr />

            {configKey === CONFIG_KEY.basic && (
                <Stack>
                    <Dropdown
                        label="Language"
                        selectedKey={langStore.lang}
                        options={langOptions}
                        onChange={(e, op) => {
                            op && langStore.changeLocalesAndReload(op.key as string);
                        }}
                    />
                </Stack>
            )}
            {configKey === CONFIG_KEY.design && <DesignSegment />}
            {configKey === CONFIG_KEY.analysis && <AnalysisSettings />}
        </SetUpDiv>
    );
}

export default observer(Setup);
