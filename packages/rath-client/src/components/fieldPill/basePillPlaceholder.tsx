import React, { useRef } from 'react';
import { PillPlaceholder } from './fieldPlaceholder';
 
interface BasePillPlaceholderProps {
    onClick: () => void;
    text: string;
}
const  BasePillPlaceholder: React.FC<BasePillPlaceholderProps> = props => {
    const { onClick, text } = props;
    const container = useRef<HTMLDivElement>(null);
    return <PillPlaceholder ref={container} onClick={onClick}>
        + {text}
    </PillPlaceholder>
}

export default BasePillPlaceholder;