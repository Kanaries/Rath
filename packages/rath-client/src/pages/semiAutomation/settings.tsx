import { observer } from 'mobx-react-lite';
import { ChoiceGroup, IChoiceGroupOption, Panel } from 'office-ui-fabric-react';
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
    const { showSettings, settings } = discoveryMainStore;
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
        <hr />
        <OperationBar />
    </Panel>
}

export default observer(PatternSetting);
