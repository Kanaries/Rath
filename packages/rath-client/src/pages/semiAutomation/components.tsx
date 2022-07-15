import styled from 'styled-components';

export const AssoContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
    background-color: #eee;
    margin-top: 1em;
    padding: 4px;
    .asso-segment{
        flex-grow: 1;
        background-color: #fff;
        /* max-width: 400px; */
        max-height: 400px;
        overflow: auto;
        margin: 4px;
        padding: 10px;
        position: relative;
        .chart-container{
            min-height: 280px;    
        }
        .chart-desc{
            font-size: 12px;
        }
    }
`

export const LoadingLayer = styled.div`
    position: absolute;
    z-index: 99;
    background-color: rgba(255, 255, 255, 0.8);
    top: 0px;
    left: 0px;
    right: 0px;
    bottom: 0px;
    display: flex;
    justify-content: center;
`

export const MainViewContainer = styled.div`
    .vis-container{
        display: flex;
        margin: 6px 0px;
    }
    .fields-container{
        display: flex;
        padding: 1em 0em 0em 0em;
    }
    .action-buttons{
        margin: 6px 0px;
        display: flex;
        /* justify-content: center; */
        align-items: flex;
    }
`