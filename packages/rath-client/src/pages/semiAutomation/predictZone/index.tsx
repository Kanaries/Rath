import React from 'react';
import intl from 'react-intl-universal';
import PattSegment from './pattSegment';
import FeatSegment from './featSegment';
import FilterSegment from './filterSegment';

const PredictZone: React.FC = (props) => {
    return (
        <div>
            <div className="pure-card">
                <h1 className="ms-fontSize-18">{intl.get('semiAuto.main.associate.patterns')}</h1>
                <PattSegment />
            </div>
            <div className="pure-card">
                <h1 className="ms-fontSize-18">{intl.get('semiAuto.main.associate.features')}</h1>
                <FeatSegment />
            </div>
            <div className="pure-card">
                <h1 className="ms-fontSize-18">{intl.get('semiAuto.main.associate.filters')}</h1>
                <FilterSegment />
            </div>
        </div>
    );
};

export default PredictZone;
