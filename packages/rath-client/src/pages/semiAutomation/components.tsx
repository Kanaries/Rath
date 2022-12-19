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
        margin: 6px 0px;
        .vis{
            overflow-x: auto;
            flex-grow: 1;
            flex-shink: 1;
        }
        .spec{

        }
        display: flex;
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

export const InsightDesc = styled.div`
    margin: 4px 12px 0px 12px;
    padding: 12px;
    border: 1px solid #95de64;
    font-size: 12px;
    max-width: 600px;
    overflow-y: auto;
    background-color: rgba(255, 255, 255, 0.9);
    .insight-header{
        display: flex;
        font-size: 14px;
        line-height: 14px;
        margin-bottom: 8px;
        .type-title{

        }
        .type-score{
            margin-left: 1em;
            padding-left: 1em;
            border-left: 1px solid #bfbfbf;
        }
    }
    .type-label{
        background-color: green;
        color: white;
        display: inline-block;
        padding: 0px 1em;
        border-radius: 8px;
        font-size: 12px;
    }
`

export const FloatingOver = styled.div`
    background-color: transparent;
    color:#ffffff;
    opacity: 30%;
    z-index: 9999;
    position: fixed;
    height: auto;
    width: auto;
    padding:5px;
    text-align:center;
    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
    right: 10%;
    top: 5%;
`