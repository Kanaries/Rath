import styled from 'styled-components';
import { IconButton, Theme } from '@fluentui/react';


export const QueryContainer = styled.div<{ theme: Theme }>`
    flex-grow: 1;
    flex-shrink: 1;
    flex-basis: 0%;
    min-height: 40vh;
    max-height: 70vh;
    overflow: hidden;
    display: grid;
    grid-template-columns: 16em 1fr;
    grid-template-rows: max-content 1fr;
    border: 1px solid ${({ theme }) => theme.palette.neutralLight};
    font-size: 0.8rem;
`;

export const QueryBrowserHeader = styled.header`
    padding-block: 0.6em;
    padding-inline: 1.2em;
    display: flex;
    align-items: center;
    user-select: none;
    justify-content: space-between;
    > .title {
        flex-grow: 1;
        flex-shrink: 1;
        margin-right: 1em;
    }
`;

export const QueryViewBody = styled.div<{ theme: Theme }>`
    display: flex;
    align-items: stretch;
    justify-content: stretch;
    overflow: auto;
    position: relative;
    border-left: 1px solid ${({ theme }) => theme.palette.neutralLight};
`;

export const SyncButton = styled(IconButton)<{ busy: boolean }>`
    width: 24px;
    height: 24px;
    background: none;
    i {
        font-size: 0.7rem;
        animation: rotating 2.4s linear infinite;
        ${({ busy }) => busy ? '' : 'animation: none;'}
    }
    @keyframes rotating {
        from {
            transform: rotate(0);
        }
        to {
            transform: rotate(360deg);
        }
    }
`;

export const PivotList = styled.div<{ theme: Theme }>`
    display: flex;
    flex-direction: row;
    align-items: stretch;
    overflow: auto hidden;
    background-color: #fcfcfc;
    border-left: 1px solid ${({ theme }) => theme.palette.neutralLight};
    > * {
        flex-grow: 0;
        flex-shrink: 0;
    }
`;

export const PivotHeader = styled.div<{ primary?: boolean }>`
    display: flex;
    flex-direction: row;
    align-items: center;
    min-width: 6em;
    padding-inline: 1em 0.6em;
    background-color: #f8f8f8;
    font-weight: ${({ primary }) => primary ? 600 : 400};
    cursor: pointer;
    outline: none;
    position: relative;
    :hover:not([aria-disabled="true"]) {
        background-color: #f2f2f2;
        > button {
            opacity: 1;
        }
    }
    &[aria-selected="true"]:not([aria-disabled="true"]) {
        background-image: linear-gradient(to top, currentColor 2px, transparent 2px);
    }
    &[aria-disabled="true"] {
        filter: contrast(0.5) brightness(1.5);
        cursor: default;
    }
    > span {
        flex-grow: 1;
    }
    > button {
        border-radius: 50%;
        font-size: 100%;
        opacity: 0;
        transform: scale(50%);
        margin-left: 0.6em;
    }
`;

export const MessageContainer = styled.div`
    padding: 0.5em;
    color: red;
`;

export const SpinnerContainer = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
`;
