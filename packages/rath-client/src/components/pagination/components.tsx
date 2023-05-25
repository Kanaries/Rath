import styled from "styled-components";


const Container = styled.div`
    margin-block: 1.75rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
`;

const ContentSm = styled.div`
    flex-grow: 1;
    flex-shrink: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    @media (min-width: 1024px) {
        display: none;
    }
`;

const ContentLg = styled.div`
    flex-grow: 1;
    flex-shrink: 1;
    display: none;
    @media (min-width: 1024px) {
        display: flex;
    }
    align-items: center;
    justify-content: space-between;
    overflow: hidden;
    > * + * {
        margin-left: -1px;
    }
`;

const Description = styled.div`
    flex-grow: 1;
    flex-shrink: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    > p {
        font-size: 0.875rem;
        line-height: 1.25rem;
        color: #4b5563;
        opacity: 0.6;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
`;

const TabList = styled.div`
    flex-grow: 0;
    flex-shrink: 0;
    display: inline-flex;
    position: relative;
    padding: 2px;
    :not(:first-child) {
        margin-left: 1rem;
    }
`;

const CurrentTab = styled.div`
    flex-grow: 0;
    flex-shrink: 0;
    width: max-content;
    min-width: 2em;
    cursor: default;
    padding: 0.75rem 1rem;
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.25rem;
    letter-spacing: 0.025em;
    text-align: center;
    white-space: break-all;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const Tab = styled.div`
    flex-grow: 0;
    flex-shrink: 0;
    width: max-content;
    min-width: 2em;
    cursor: pointer;
    padding: 0.75rem 1rem;
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.25rem;
    letter-spacing: 0.025em;
    text-align: center;
    white-space: break-all;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.75;
    &:hover {
        opacity: 1;
        color: #6366f1;
    }
    &:focus {
        opacity: 1;
        color: #6366f1;
        outline: 2px solid transparent;
        outline-offset: 2px;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.5);
    }
`;

const Ellipsis = styled.div`
    flex-grow: 0;
    flex-shrink: 0;
    width: max-content;
    min-width: 2em;
    cursor: default;
    padding: 0.75rem 1rem;
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.25rem;
    letter-spacing: 0.025em;
    text-align: center;
    white-space: break-all;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.75;
`;

const Button = styled.div`
    flex-grow: 0;
    flex-shrink: 0;
    width: max-content;
    min-width: 2em;
    cursor: pointer;
    padding: 0.75rem 1rem;
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.25rem;
    letter-spacing: 0.025em;
    text-align: center;
    white-space: break-all;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.75;
    &[aria-disabled="false"]:hover {
        opacity: 1;
        color: #6366f1;
    }
    &[aria-disabled="false"]:focus {
        opacity: 1;
        color: #6366f1;
        outline: 2px solid transparent;
        outline-offset: 2px;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.5);
    }
    &[aria-disabled="true"] {
        cursor: default;
    }
    > * + * {
        margin-left: 0.5rem;
    }
    > span {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
    }
    > i {
        width: 1.25rem;
        height: 1.25rem;
    }
`;


const PaginationComponents = {
    Container,
    ContentSm,
    ContentLg,
    Description,
    TabList,
    CurrentTab,
    Tab,
    Ellipsis,
    Button,
};


export default PaginationComponents;
