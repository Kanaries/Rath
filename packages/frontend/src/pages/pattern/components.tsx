import React from 'react'
import styled from 'styled-components';

export const AssoContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
    background-color: #eee;
    margin-top: 1em;
    .asso-segment{
        background-color: #fff;
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
    }
    .action-buttons{
        margin: 6px 0px;
    }
`