import React from 'react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { useGlobalStore } from '../../../store';
import { Card } from '../../../components/card';
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
                <Card>
                    <h1 className="ms-fontSize-18">{intl.get('semiAuto.main.associate.neighbors')}</h1>
                    <NeighborSegment />
                </Card>
            )}
            {pattViews.views.length > 0 && (
                <Card>
                    <h1 className="ms-fontSize-18">{intl.get('semiAuto.main.associate.patterns')}</h1>
                    <PattSegment />
                </Card>
            )}
            {featViews.views.length > 0 && (
                <Card>
                    <h1 className="ms-fontSize-18">{intl.get('semiAuto.main.associate.features')}</h1>
                    <FeatSegment />
                </Card>
            )}
            {filterViews.views.length > 0 && (
                <Card>
                    <h1 className="ms-fontSize-18">{intl.get('semiAuto.main.associate.filters')}</h1>
                    <FilterSegment />
                </Card>
            )}
        </div>
    );
};

export default observer(PredictZone);
