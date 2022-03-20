import React from 'react';
import { IMutField } from "../interfaces";
import { DocumentTextIcon, HashtagIcon, CalendarIcon } from '@heroicons/react/outline';

const DataTypeIcon: React.FC<{dataType: IMutField['semanticType']; analyticType: IMutField['analyticType']}> = props => {
    const { dataType, analyticType } = props;
    const color = analyticType === 'dimension' ? 'text-blue-500' : 'text-green-500'
    const iconClassName = `w-3 inline-block mr-0.5 ${color}`
    switch (dataType) {
        case 'quantitative':
        case 'ordinal':
            return <HashtagIcon className={iconClassName} />
        case 'temporal':
            return <CalendarIcon />
        default:
            return <DocumentTextIcon className={iconClassName} />
    }
}

export default DataTypeIcon;