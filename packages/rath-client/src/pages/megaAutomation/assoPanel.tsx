import React from 'react';
import { observer } from 'mobx-react-lite';
import { Panel, PanelType } from 'office-ui-fabric-react';
import { useGlobalStore } from '../../store';
import Association from './association';

const AssoPanel: React.FC = () => {
    const { exploreStore } = useGlobalStore();
    return <div>
        <Panel isOpen={exploreStore.showAsso}
                type={PanelType.medium}
                onDismiss={() => {
                    exploreStore.setShowAsso(false);
            }}>
                <Association />
            </Panel>
    </div>
}

export default observer(AssoPanel);
