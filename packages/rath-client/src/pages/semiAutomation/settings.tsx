import { observer } from 'mobx-react-lite';
import { ChoiceGroup, IChoiceGroupOption, Label, Panel, Toggle } from 'office-ui-fabric-react';
import React, { useMemo } from 'react';
import { useGlobalStore } from '../../store';
import intl from 'react-intl-universal';
import OperationBar from './operationBar';

const PatternSetting: React.FC = () => {
    const { discoveryMainStore } = useGlobalStore();
    const options = useMemo<IChoiceGroupOption[]>(() => {
        return [
            { text: intl.get('discovery.main.vizsys.lite'), key: 'lite' },
            { text: intl.get('discovery.main.vizsys.strict'), key: 'strict' }
        ]
    }, [])
    const { showSettings, settings, autoAsso } = discoveryMainStore;
    const { vizAlgo } = settings;
    return <Panel
        isOpen={showSettings}
        headerText={intl.get('common.settings')}
        onDismiss={() => {
            discoveryMainStore.setShowSettings(false);
        }}
        >
        <hr />
        <ChoiceGroup
            label={intl.get('discovery.main.vizsys.title')}
            onChange={(e, op) => {
                op && discoveryMainStore.updateSettings('vizAlgo', op.key)
            }}
            selectedKey={vizAlgo}
            options={options}
        />
        <hr style={{ marginTop: '1em'}} />
        <Label>Auto Prediction</Label>
        <Toggle checked={autoAsso.featViews} onText="Auto" offText="Manual" label="Feat" onChange={(e, checked) => {
            discoveryMainStore.updateAutoAssoConfig('featViews', Boolean(checked))
        }} />
        <Toggle checked={autoAsso.pattViews} onText="Auto" offText="Manual" label="Patt" onChange={(e, checked) => {
            discoveryMainStore.updateAutoAssoConfig('pattViews', Boolean(checked))
        }} />
        <Toggle checked={autoAsso.filterViews} onText="Auto" offText="Manual" label="Subspace" onChange={(e, checked) => {
            discoveryMainStore.updateAutoAssoConfig('filterViews', Boolean(checked))
        }} />
        <hr />
        <OperationBar />
    </Panel>
}

export default observer(PatternSetting);
