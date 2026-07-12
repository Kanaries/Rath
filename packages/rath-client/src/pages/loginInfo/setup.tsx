import { useState } from 'react';
import styled from 'styled-components';
import { observer } from 'mobx-react-lite';
import intl from 'react-intl-universal';
import { SUPPORT_LANG } from '../../locales';
import { useGlobalStore } from '../../store';
import AnalysisSettings from '../../components/analysisSettings';
import { RathSelect, RathSelectOption } from '../../components/rath-ui/rath-select';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import DesignSegment from './design';

const langOptions: RathSelectOption[] = SUPPORT_LANG.map((lang) => ({
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
            <Tabs value={configKey} onValueChange={(value) => setConfigKey(value as CONFIG_KEY)}>
                <TabsList>
                    <TabsTrigger value={CONFIG_KEY.basic}>{intl.get(`login.configKeys.${CONFIG_KEY.basic}`)}</TabsTrigger>
                    <TabsTrigger value={CONFIG_KEY.design}>{intl.get(`login.configKeys.${CONFIG_KEY.design}`)}</TabsTrigger>
                    <TabsTrigger value={CONFIG_KEY.analysis}>{intl.get(`login.configKeys.${CONFIG_KEY.analysis}`)}</TabsTrigger>
                </TabsList>
            </Tabs>
            <hr />

            {configKey === CONFIG_KEY.basic && (
                <div>
                    <RathSelect
                        label="Language"
                        selectedKey={langStore.lang}
                        options={langOptions}
                        onChange={(key) => {
                            langStore.changeLocalesAndReload(key as string);
                        }}
                    />
                </div>
            )}
            {configKey === CONFIG_KEY.design && <DesignSegment />}
            {configKey === CONFIG_KEY.analysis && <AnalysisSettings />}
        </SetUpDiv>
    );
}

export default observer(Setup);
