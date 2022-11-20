import { observer } from 'mobx-react-lite';
import { ChoiceGroup, IChoiceGroupOption, Label, Panel, Toggle } from '@fluentui/react';
import React, { useMemo } from 'react';
import intl from 'react-intl-universal';
import { useGlobalStore } from '../../store';
import OperationBar from './operationBar';

const PatternSetting: React.FC = () => {
    const { semiAutoStore } = useGlobalStore();
    const options = useMemo<IChoiceGroupOption[]>(() => {
        return [
            { text: intl.get('semiAuto.main.vizsys.lite'), key: 'lite' },
            { text: intl.get('semiAuto.main.vizsys.strict'), key: 'strict' }
        ]
    }, [])
    const { showSettings, settings, autoAsso } = semiAutoStore;
    const { vizAlgo } = settings;
    return <Panel
        isOpen={showSettings}
        headerText={intl.get('common.settings')}
        onDismiss={() => {
            semiAutoStore.setShowSettings(false);
        }}
        >
        <hr />
        <ChoiceGroup
            label={intl.get('semiAuto.main.vizsys.title')}
            onChange={(e, op) => {
                op && semiAutoStore.updateSettings('vizAlgo', op.key)
            }}
            selectedKey={vizAlgo}
            options={options}
        />
        <hr style={{ marginTop: '1em'}} />
        <Label>Auto Prediction</Label>
        <Toggle checked={autoAsso.featViews} onText="Auto" offText="Manual" label="features" onChange={(e, checked) => {
            semiAutoStore.updateAutoAssoConfig('featViews', Boolean(checked))
        }} />
        <Toggle checked={autoAsso.pattViews} onText="Auto" offText="Manual" label="patterns" onChange={(e, checked) => {
            semiAutoStore.updateAutoAssoConfig('pattViews', Boolean(checked))
        }} />
        <Toggle checked={autoAsso.filterViews} onText="Auto" offText="Manual" label="subsets" onChange={(e, checked) => {
            semiAutoStore.updateAutoAssoConfig('filterViews', Boolean(checked))
        }} />
        <Toggle checked={autoAsso.neighborViews} onText="Auto" offText="Manual" label="neighbors" onChange={(e, checked) => {
            semiAutoStore.updateAutoAssoConfig('neighborViews', Boolean(checked))
        }} />
        <hr />
        <OperationBar />
    </Panel>
}

export default observer(PatternSetting);
