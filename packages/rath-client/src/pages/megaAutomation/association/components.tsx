import styled from 'styled-components';

export const AssociationContainer = styled.div`
    border: solid 1px var(--border);
    margin-top: 2em;
    background-color: #e7e7e7;
    .asso-content-container{
        display: flex;
        flex-wrap: wrap;
        overflow: auto
    }
`
export const AssoViewContainer = styled.div`
    background-color: var(--card);
    margin: 3px;
    padding: 10px;
    flex-grow: 1;
`