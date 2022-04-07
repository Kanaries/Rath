import { observer } from 'mobx-react-lite';
import { ChoiceGroup, IChoiceGroupOption, Panel } from 'office-ui-fabric-react';
import React from 'react';
import { useGlobalStore } from '../../store';

const options: IChoiceGroupOption[] = [
    { text: 'lite', key: 'lite' },
    { text: 'strict', key: 'strict' }
]

const PatternSetting: React.FC = props => {
    const { discoveryMainStore } = useGlobalStore();
    const { showSettings, settings } = discoveryMainStore;
    const { vizAlgo } = settings;
    return <Panel
        isOpen={showSettings}
        headerText="Settings"
        onDismiss={() => {
            discoveryMainStore.setShowSettings(false);
        }}
        >
        <hr />
        <ChoiceGroup
            label="viz recommand system"
            onChange={(e, op) => {
                op && discoveryMainStore.updateSettings('vizAlgo', op.key)
            }}
            selectedKey={vizAlgo}
            options={options}
        />
    </Panel>
}

export default observer(PatternSetting);
