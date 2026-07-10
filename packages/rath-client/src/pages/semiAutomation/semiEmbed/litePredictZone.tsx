import React, { useState } from 'react';
import intl from 'react-intl-universal';
import { Tabs, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import PattSegment from '../predictZone/pattSegment';
import FeatSegment from '../predictZone/featSegment';
import FilterSegment from '../predictZone/filterSegment';
import { IRenderViewKey } from '../../../store/semiAutomation/localTypes';
import NeighborSegment from '../predictZone/neighborSegment';

const LitePredictZone: React.FC = (props) => {
    const [viewType, setViewType] = useState<IRenderViewKey>('pattViews');
    return (
        <div>
            <Tabs value={viewType} onValueChange={(value) => setViewType(value as IRenderViewKey)}>
                <TabsList>
                    <TabsTrigger value="neighborViews">{intl.get('semiAuto.main.associateShorthand.neighbors')}</TabsTrigger>
                    <TabsTrigger value="pattViews">{intl.get('semiAuto.main.associateShorthand.patterns')}</TabsTrigger>
                    <TabsTrigger value="featViews">{intl.get('semiAuto.main.associateShorthand.features')}</TabsTrigger>
                    <TabsTrigger value="filterViews">{intl.get('semiAuto.main.associateShorthand.filters')}</TabsTrigger>
                </TabsList>
            </Tabs>
            <div>
                {viewType === 'pattViews' && <PattSegment />}
                {viewType === 'featViews' && <FeatSegment />}
                {viewType === 'filterViews' && <FilterSegment />}
                {viewType === 'neighborViews' && <NeighborSegment />}
            </div>
        </div>
    );
};

export default LitePredictZone;
