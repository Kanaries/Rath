import React from 'react';
import { observer } from 'mobx-react-lite'
import { useGlobalStore } from '../../../store';
import { Panel, PanelType } from 'office-ui-fabric-react';

import BaseChart from '../../../visBuilder/vegaBase';
import Association from '../association';
import ConstraintsPanel from './constraints';

const VizOperation: React.FC = props => {
    const { exploreStore, ltsPipeLineStore } = useGlobalStore();
    const { forkView, visualConfig, showAsso } = exploreStore
    const { fieldMetas } = ltsPipeLineStore

    const forkViewSpec = exploreStore.forkViewSpec;
    if (forkView !== null) {
        return <div>
            <Panel isOpen={showAsso}
                type={PanelType.medium}
                onDismiss={() => {
                    exploreStore.setShowAsso(false);
            }}>
                <Association />
            </Panel>
            <ConstraintsPanel />
            {
                forkViewSpec && <BaseChart
                    sizeMode='auto'
                    defaultAggregated={visualConfig.defaultAggregated}
                    defaultStack={visualConfig.defaultStack}
                    dimensions={forkView.dimensions}
                    measures={forkView.measures}
                    dataSource={visualConfig.defaultAggregated ? forkViewSpec.dataView : ltsPipeLineStore.dataSource}
                    schema={forkViewSpec.schema}
                    fieldFeatures={fieldMetas}
                    aggregator={visualConfig.aggregator}
                />
            }
        </div>
    } else {
        return <div></div>
    }
}

export default observer(VizOperation)
