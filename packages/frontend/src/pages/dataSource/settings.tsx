import { observer } from 'mobx-react-lite';
import { Dropdown, IDropdownOption, Panel } from 'office-ui-fabric-react';
import React, { useMemo } from 'react';
import { ICubeStorageManageMode } from 'visual-insights';
import { useGlobalStore } from '../../store';

const AnalysisSettings: React.FC = props => {
    const { ltsPipeLineStore, commonStore } = useGlobalStore();

    const options = useMemo<IDropdownOption[]>(() => {
        return [
            {
                text: 'disk',
                key: ICubeStorageManageMode.LocalDisk
            },
            {
                text: 'mix',
                key: ICubeStorageManageMode.LocalMix
            },
            {
                text: 'memory',
                key: ICubeStorageManageMode.LocalCache
            }
        ]
    }, [])
    return <Panel isOpen={commonStore.showAnalysisConfig}
        title="Analysis Settings"
        onDismiss={() => {commonStore.setShowAnalysisConfig(false) }}>
        <Dropdown options={options}
        label="OLAP Storage Manage Mode"
        selectedKey={ltsPipeLineStore.cubeStorageManageMode}
        onChange={(e, op) => {
            op && ltsPipeLineStore.setCubeStorageManageMode(op.key as ICubeStorageManageMode)
        }} />
    </Panel>
}

export default observer(AnalysisSettings);
