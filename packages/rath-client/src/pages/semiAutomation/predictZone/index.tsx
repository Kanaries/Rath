import React from 'react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { useGlobalStore } from '../../../store';
import PattSegment from './pattSegment';
import FeatSegment from './featSegment';
import FilterSegment from './filterSegment';
import NeighborSegment from './neighborSegment';

const PredictZone: React.FC = (props) => {
    const { semiAutoStore } = useGlobalStore();
    const { featViews, pattViews, filterViews, neighborViews } = semiAutoStore;
    return (
        <div>
            {neighborViews.views.length > 0 && (
                <div className="pure-card">
                    <h1 className="ms-fontSize-18">{intl.get('semiAuto.main.associate.neighbors')}</h1>
                    <NeighborSegment />
                </div>
            )}
            {pattViews.views.length > 0 && (
                <div className="pure-card">
                    <h1 className="ms-fontSize-18">{intl.get('semiAuto.main.associate.patterns')}</h1>
                    <PattSegment />
                </div>
            )}
            {featViews.views.length > 0 && (
                <div className="pure-card">
                    <h1 className="ms-fontSize-18">{intl.get('semiAuto.main.associate.features')}</h1>
                    <FeatSegment />
                </div>
            )}
            {filterViews.views.length > 0 && (
                <div className="pure-card">
                    <h1 className="ms-fontSize-18">{intl.get('semiAuto.main.associate.filters')}</h1>
                    <FilterSegment />
                </div>
            )}
        </div>
    );
};

export default observer(PredictZone);
