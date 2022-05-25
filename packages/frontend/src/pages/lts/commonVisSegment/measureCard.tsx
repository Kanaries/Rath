import React from 'react';
import styled from 'styled-components';

const Cont = styled.div`
    padding: 6px 12px;
    margin-right: 1em;
    .mea-header{
        font-size: 1em;
        color: #434343;
    }
    .mea-content{
        font-size: 2em;
    }
`

interface MeasureCardProps {
    headerText: string;
    contentText: string;
}
const MeasureCard: React.FC<MeasureCardProps> = props => {
    const { headerText, contentText } = props;
    return <Cont>
        <div className="mea-header">{headerText}</div>
        <div className="mea-content">{contentText}</div>
    </Cont>
}

export default MeasureCard;
