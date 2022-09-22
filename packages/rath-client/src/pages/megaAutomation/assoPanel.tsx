import React from 'react';
import { observer } from 'mobx-react-lite';
import { Panel, PanelType } from '@fluentui/react';
import { useGlobalStore } from '../../store';
import Association from './association';

const AssoPanel: React.FC = () => {
    const { megaAutoStore } = useGlobalStore();
    return <div>
        <Panel isOpen={megaAutoStore.showAsso}
                type={PanelType.medium}
                onDismiss={() => {
                    megaAutoStore.setShowAsso(false);
            }}>
                <Association />
            </Panel>
    </div>
}

export default observer(AssoPanel);
