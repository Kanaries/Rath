import styled from "styled-components";


const Box = styled.div`
    width: 100%;
`;

const Root = styled.div`
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    counter-reset: step 0;
`;

const Item = styled.div`
    padding-inline: 0.5em;
    flex: 1;
    position: relative;
    counter-increment: step;
    :first-child .connector {
        display: none;
    }
`;

const Connector = styled.div`
    flex: 1 1 auto;
    position: absolute;
    top: 1em;
    left: calc(-50% + 1.5em);
    right: calc(50% + 1.5em);
    transform: translateY(-100%);
    > span {
        display: block;
        border-color: #bdbdbd;
        border-top-style: solid;
        border-top-width: 1px;
    }
`;

const Label = styled.span`
    display: flex;
    flex-direction: column;
    align-items: center;
    > .icon {
        flex-shrink: 0;
        display: flex;
        > * {
            user-select: none;
            width: 1em;
            height: 1em;
            fill: currentColor;
            flex-shrink: 0;
            font-size: 1.5rem;
            transition: color 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
            border-radius: 50%;
            overflow: hidden;
            background-color: #a2a2a2;
            fill: #fff;
            color: #fff;
            display: none;
            &.uncompleted {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                ::before {
                    display: inline-block;
                    content: counter(step);
                    font-size: 0.8rem;
                }
            }
            &.completed {
                background-color: #3b82f6;
            }
        }
    }
    *.completed > & > .icon > .completed {
        display: inline-block;
    }
    *.completed > & > .icon > .uncompleted {
        display: none;
    }
    > .label {
        width: 100%;
        color: #000000aa;
        > span {
            text-align: center;
            margin-top: 1.2em;
            font-size: 0.875rem;
            font-weight: 400;
            line-height: 1.43;
            letter-spacing: 0.01071em;
            display: block;
        }
    }
    *.active > & > .label > span {
        color: #000000d4;
        font-weight: 600 !important;
    }
    *.completed > & > .label > span {
        color: #000000d4;
        font-weight: 500;
    }
`;

const StepperComponents = {
    Box,
    Root,
    Item,
    Connector,
    Label,
};


export default StepperComponents
