import React from 'react';
import PattSegment from './pattSegment';
import FeatSegment from './featSegment';
import FilterSegment from './filterSegment';


const PredictZone: React.FC = props => {
    return <div>
        <PattSegment />
        <FeatSegment />
        <FilterSegment />
    </div>
}

export default PredictZone;
