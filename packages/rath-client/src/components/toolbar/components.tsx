import { KeyboardEvent, MouseEvent, useMemo, useRef } from "react";
import styled from "styled-components";


export const useHandlers = (action: () => void, disabled: boolean, triggerKeys: string[] = ['Enter'], allowPropagation = true) => {
    const actionRef = useRef(action);
    actionRef.current = () => {
        if (disabled) {
            return;
        }
        action();
    };
    const triggerKeysRef = useRef(triggerKeys);
    triggerKeysRef.current = triggerKeys;

    return useMemo(() => ({
        onClick: (ev: MouseEvent) => {
            if (!allowPropagation) {
                ev.stopPropagation();
            }
            actionRef.current();
        },
        onKeyDown: (ev: KeyboardEvent) => {
            if (!allowPropagation) {
                ev.stopPropagation();
            }
            if (triggerKeysRef.current.includes(ev.key)) {
                ev.stopPropagation();
                ev.preventDefault();
                actionRef.current();
            }
        },
        onMouseOut: (ev: MouseEvent) => {
            if (!allowPropagation) {
                ev.stopPropagation();
            }
            (document.querySelector('*:focus') as null | HTMLElement)?.blur();
        },
    }), [allowPropagation]);
};

export const ToolbarContainer = styled.div`
    --height: 36px;
    --icon-size: 18px;
    width: 100%;
    height: var(--height);
    background-color: var(--background-color);
    color: var(--color);
    /* box-shadow: 0px 1px 3px 1px rgba(136, 136, 136, 0.1); */
    border-radius: 2px;
    overflow: hidden;
    display: flex;
    flex-direction: row;
    > * {
        flex-grow: 0;
        flex-shrink: 0;
    }
`;

export const ToolbarSplitter = styled.div`
    display: inline-block;
    margin: calc(var(--height) / 6) calc(var(--icon-size) / 4);
    height: calc(var(--height) * 2 / 3);
    width: 1px;
    background: #bbbbbb50;
`;

export const ToolbarItemContainerElement = styled.div<{ split: boolean }>`
    display: inline-flex;
    flex-direction: row;
    user-select: none;
    outline: none;
    width: ${({ split }) => split ? 'calc(var(--height) + 10px)' : 'var(--height)'};
    height: var(--height);
    overflow: hidden;
    color: var(--color);
    position: relative;
    > svg {
        flex-grow: 0;
        flex-shrink: 0;
        width: var(--icon-size);
        height: var(--icon-size);
        margin: calc((var(--height) - var(--icon-size)) / 2);
        margin-right: ${({ split }) => split ? 'calc((var(--height) - var(--icon-size)) / 4)' : ''};
        transition: text-shadow 100ms;
    }
    --shadow-color: #0F172A55;
    &[aria-disabled=true] {
        cursor: default;
        > * {
            opacity: 0.33;
        }
    }
    &[aria-disabled=false] {
        cursor: pointer;
        :hover, :focus, &.open {
            background-image: linear-gradient(#FFFFFFCC, #FEFEFECC);
            --background-color: #FEFEFE;
            color: var(--color-hover);
            &.split * svg {
                pointer-events: none;
                transform: translate(-50%, -20%);
            }
            & svg {
                text-shadow: 0 0 1.5px var(--shadow-color);
            }
        }
    }
    transition: color 100ms, background-image 100ms;
`;
