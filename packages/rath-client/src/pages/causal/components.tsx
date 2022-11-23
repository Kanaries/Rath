import styled from 'styled-components';

export const InnerCard = styled.div`
    .card-header {
        font-size: 1.2em;
    }
    .card-line {
        margin: 8px 0px;
    }
    border: 1px solid #e3e2e2;
    margin: 8px 0px;
    padding: 8px;
    overflow: auto;
    > h2 {
        & + * {
            margin-bottom: 2em;
        }
    }
`;