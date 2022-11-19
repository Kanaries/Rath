import React, { useState } from 'react';
import { Pivot, PivotItem } from '@fluentui/react';
import intl from 'react-intl-universal';
import PattSegment from '../predictZone/pattSegment';
import FeatSegment from '../predictZone/featSegment';
import FilterSegment from '../predictZone/filterSegment';
import { IRenderViewKey } from '../../../store/semiAutomation/localTypes';
import NeighborSegment from '../predictZone/neighborSegment';

const LitePredictZone: React.FC = (props) => {
    const [viewType, setViewType] = useState<IRenderViewKey>('pattViews');
    return (
        <div>
            <Pivot
                onLinkClick={(item) => {
                    item && setViewType(item.props.itemKey as IRenderViewKey);
                }}
            >
                <PivotItem headerText={intl.get('semiAuto.main.associateShorthand.neighbors')} itemKey="neighborViews" />
                <PivotItem headerText={intl.get('semiAuto.main.associateShorthand.patterns')} itemKey="pattViews" />
                <PivotItem headerText={intl.get('semiAuto.main.associateShorthand.features')} itemKey="featViews" />
                <PivotItem headerText={intl.get('semiAuto.main.associateShorthand.filters')} itemKey="filterViews" />
            </Pivot>
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
