import React from 'react';
import styled from 'styled-components';

const StyledCont = styled.div`
    position: absolute;
    bottom: 0px;
    left: 0px;
    right: 0px;
    height: 200px;
    background-color: #fff;
    z-index: 100;
    .idea-actions{
        padding: 5px;
    }
    .idea-content{
        padding: 5px;
    }
`
const Ideas: React.FC = () => {
    return <StyledCont>
        <div className="idea-actions">
            <h1>Ideas</h1>
        </div>
        <div className="idea-content">
            {}
        </div>
    </StyledCont>
}

export default Ideas