import React from 'react'
import styled from 'styled-components';

export const AssoContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
    background-color: #eee;
    margin-top: 1em;
    .asso-segment{
        flex-grow: 1;
        background-color: #fff;
        /* max-width: 400px; */
        max-height: 400px;
        overflow: auto;
        margin: 4px;
        padding: 10px;
        .chart-container{
            min-height: 320px;
        }
    }
`

export const MainViewContainer = styled.div`
    .vis-container{
        display: flex;
        margin: 6px 0px;
        .fields-container{
            display: flex;
            padding: 2em 0em;
        }
    }
    .action-buttons{
        margin: 6px 0px;
        display: flex;
        /* justify-content: center; */
        align-items: flex;
    }
`