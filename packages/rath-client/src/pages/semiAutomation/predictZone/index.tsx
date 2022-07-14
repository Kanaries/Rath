import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';

import { useGlobalStore } from '../../../store';
import PattSegment from './pattSegment';
import FeatSegment from './featSegment';
import FilterSegment from './filterSegment';


const PredictZone: React.FC = props => {
    const { discoveryMainStore } = useGlobalStore();
    const { dataSource, fieldMetas, mainView, autoAsso } = discoveryMainStore;
    const { pattViews: autoPatt, featViews: autoFeat, filterViews: autoFilter } = autoAsso;
    useEffect(() => {
        if (mainView) {
            autoPatt && discoveryMainStore.pattAssociate();
            autoFeat && discoveryMainStore.featAssociate();
            autoFilter && discoveryMainStore.filterAssociate();
        }
    }, [dataSource, fieldMetas, mainView, autoFeat, autoPatt, autoFilter, discoveryMainStore])
    return <div>
        <PattSegment />
        <FeatSegment />
        <FilterSegment />
    </div>
}

export default observer(PredictZone);
