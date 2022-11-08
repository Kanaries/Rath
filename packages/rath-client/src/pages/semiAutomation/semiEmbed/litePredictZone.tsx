import React, { useState } from 'react';
import { Pivot, PivotItem } from '@fluentui/react';
import PattSegment from '../predictZone/pattSegment';
import FeatSegment from '../predictZone/featSegment';
import FilterSegment from '../predictZone/filterSegment';
import { IRenderViewKey } from '../../../store/semiAutomation/localTypes';

const LitePredictZone: React.FC = (props) => {
    const [viewType, setViewType] = useState<IRenderViewKey>('pattViews');
    return (
        <div>
            <Pivot
                onLinkClick={(item) => {
                    item && setViewType(item.props.itemKey as IRenderViewKey);
                }}
            >
                <PivotItem headerText="Patterns" itemKey="pattViews" />
                <PivotItem headerText="Features" itemKey="featViews" />
                <PivotItem headerText="Subsets" itemKey="filterViews" />
            </Pivot>
            <div>
                {viewType === 'pattViews' && <PattSegment />}
                {viewType === 'featViews' && <FeatSegment />}
                {viewType === 'filterViews' && <FilterSegment />}
            </div>
        </div>
    );
};

export default LitePredictZone;
