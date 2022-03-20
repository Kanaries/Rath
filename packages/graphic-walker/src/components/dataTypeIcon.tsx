import React from 'react';
import { IMutField } from "../interfaces";
import { DocumentTextIcon, HashtagIcon } from '@heroicons/react/outline';

const DataTypeIcon: React.FC<{dataType: IMutField['semanticType']}> = props => {
    const { dataType } = props;
    switch (dataType) {
        case 'quantitative':
        case 'ordinal':
            return <HashtagIcon className="w-3 inline-block mr-0.5 text-green-500" />
        default:
            return <DocumentTextIcon className="w-3 inline-block mr-0.5 text-blue-500" />
    }
}

export default DataTypeIcon;