import { observer } from 'mobx-react-lite';
import { ChoiceGroup, IChoiceGroupOption, Panel } from 'office-ui-fabric-react';
import React from 'react';
import { useGlobalStore } from '../../store';
import intl from 'react-intl-universal';

const options: IChoiceGroupOption[] = [
    { text: intl.get('discovery.main.vizsys.lite'), key: 'lite' },
    { text: intl.get('discovery.main.vizsys.strict'), key: 'strict' }
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
            label={intl.get('discovery.main.vizsys.title')}
            onChange={(e, op) => {
                op && discoveryMainStore.updateSettings('vizAlgo', op.key)
            }}
            selectedKey={vizAlgo}
            options={options}
        />
    </Panel>
}

export default observer(PatternSetting);
