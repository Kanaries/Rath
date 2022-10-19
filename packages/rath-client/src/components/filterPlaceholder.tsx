import React, { useRef } from 'react';
import intl from 'react-intl-universal';
import { PillPlaceholder } from './fieldPlaceholder';
 
interface FilterPlaceholderProps {
    onClick: () => void;
}
const  FilterPlaceholder: React.FC<FilterPlaceholderProps> = props => {
    const { onClick } = props;
    const container = useRef<HTMLDivElement>(null);
    return <PillPlaceholder ref={container} onClick={onClick}>
        + {intl.get('common.addFilter')}
    </PillPlaceholder>
}

export default FilterPlaceholder;