import { Layer, TooltipHost } from "@fluentui/react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { memo, useEffect } from "react";
import styled from "styled-components";
import Toolbar, { ToolbarProps } from ".";


const ToolbarItemContainer = styled.div<{ type: 'button' | 'toggle' | 'split' }>`
    display: inline-flex;
    flex-direction: row;
    user-select: none;
    outline: none;
    width: ${({ type }) => type === 'split' ? 'calc(var(--height) + 10px)' : 'var(--height)'};
    height: var(--height);
    overflow: hidden;
    color: #AEAEAE;
    > svg {
        flex-grow: 0;
        flex-shrink: 0;
        width: var(--icon-size);
        height: var(--icon-size);
        margin: calc((var(--height) - var(--icon-size)) / 2);
        margin-right: ${({ type }) => type === 'split' ? 'calc((var(--height) - var(--icon-size)) / 4)' : ''};
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
        :hover, &.open {
            background-image: linear-gradient(#FFFFFFCC, #FEFEFECC);
            color: #0F172A;
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

const ToggleContainer = styled.div<{ checked: boolean }>`
    flex-grow: 0;
    flex-shrink: 0;
    width: calc(var(--icon-size) + 12px);
    height: calc(var(--icon-size) + 12px);
    margin: calc((var(--height) - var(--icon-size) - 12px) / 2);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    box-shadow: ${({ checked }) => checked ? 'inset 0px 1px 6px 2px rgba(0, 0, 0, 0.33)' : 'inset 0px 1px 4px 1px rgba(136, 136, 136, 0.16)'};
    border-radius: 4px;
    position: relative;
    > svg {
        width: var(--icon-size);
        height: var(--icon-size);
        position: absolute;
        color: ${({ checked }) => checked ? '#EDEFF4' : '#525763'};
        --shadow-color: ${({ checked }) => checked ? '#2956bf66' : '#52576366'};
        transition: color 120ms;
    }
    ::before {
        display: block;
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: #132f70;
        transform: ${({ checked }) => checked ? 'translate(0)' : 'translateX(-100%)'};
        transition: transform 120ms;
    }
`;

const ToolbarSplit = styled.div<{ open: boolean }>`
    flex-grow: 1;
    flex-shrink: 1;
    display: inline-block;
    height: var(--height);
    position: relative;
    margin-right: 4px;
    > svg {
        position: absolute;
        width: calc(var(--icon-size) * 0.6);
        height: calc(var(--icon-size) * 0.6);
        left: 50%;
        top: 50%;
        transform: translate(-50%, ${({ open }) => open ? '-20%' : '-50%'});
        transition: transform 120ms;
    }
    :hover > svg {
        transform: translate(-50%, -20%);
    }
`;

export interface ToolbarButtonItem {
    key: string;
    icon: (props: React.ComponentProps<'svg'> & {
        title?: string;
        titleId?: string;
    }) => JSX.Element;
    label: string;
    /** @default false */
    disabled?: boolean;
    onClick: () => void;
}

export interface ToolbarToggleButtonItem {
    key: string;
    icon: (props: React.ComponentProps<'svg'> & {
        title?: string;
        titleId?: string;
    }) => JSX.Element;
    label: string;
    /** @default false */
    disabled?: boolean;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

export interface ToolbarSplitButtonItem {
    key: string;
    icon: (props: React.ComponentProps<'svg'> & {
        title?: string;
        titleId?: string;
    }) => JSX.Element;
    label: string;
    /** @default false */
    disabled?: boolean;
    onClick?: () => void;
    menu: ToolbarProps;
}

export type ToolbarItemProps = (
    | ToolbarButtonItem
    | ToolbarToggleButtonItem
    | ToolbarSplitButtonItem
);

const ToolbarButton = memo<{
    item: ToolbarButtonItem;
    styles?: ToolbarProps['styles'];
}>(function ToolbarButton({ item: { icon: Icon, label, disabled, onClick }, styles }) {
    return (
        <TooltipHost content={label}>
            <ToolbarItemContainer
                role="button" tabIndex={0} aria-label={label} aria-disabled={disabled ?? false}
                type="button"
                style={styles?.item}
                onClick={disabled ? undefined : onClick}
            >
                <Icon style={styles?.icon} />
            </ToolbarItemContainer>
        </TooltipHost>
    );
});

const ToolbarToggleButton = memo<{
    item: ToolbarToggleButtonItem;
    styles?: ToolbarProps['styles'];
}>(function ToolbarButton({ item: { icon: Icon, label, disabled, checked, onChange }, styles }) {
    return (
        <TooltipHost content={label}>
            <ToolbarItemContainer
                role="checkbox" tabIndex={0} aria-label={label} aria-disabled={disabled ?? false} aria-checked={checked}
                type="toggle"
                style={styles?.item}
                onClick={disabled ? undefined : () => onChange(!checked)}
            >
                <ToggleContainer checked={checked}>
                    <Icon style={styles?.icon} />
                </ToggleContainer>
            </ToolbarItemContainer>
        </TooltipHost>
    );
});

const ToolbarSplitButton = memo<{
    item: ToolbarSplitButtonItem;
    styles?: ToolbarProps['styles'];
    layerId: string;
    openedKey: string | null;
    setOpenedKey: (key: string | null) => void;
}>(function ToolbarSplitButton ({ item: { key, icon: Icon, label, disabled, onClick, menu }, styles, layerId, openedKey, setOpenedKey }) {
    const opened = key === openedKey;

    useEffect(() => {
        if (opened) {
            const close = (e?: unknown) => {
                if (e instanceof KeyboardEvent && e.key !== 'Escape') {
                    return;
                }
                setOpenedKey(null);
            };

            document.addEventListener('click', close);
            document.addEventListener('keydown', close);

            return () => {
                document.removeEventListener('click', close);
                document.removeEventListener('keydown', close);
                close();
            };
        }
    }, [setOpenedKey, opened]);

    return (
        <TooltipHost content={label}>
            {onClick ? (
                <ToolbarItemContainer
                    role="button" tabIndex={0} aria-label={label} aria-disabled={disabled ?? false}
                    type="split"
                    style={styles?.item}
                    onClick={disabled ? undefined : onClick}
                    className={opened ? 'open' : undefined}
                >
                    <Icon style={styles?.icon} />
                    <ToolbarSplit
                        role="button" tabIndex={0} aria-label={label} aria-disabled={disabled} aria-haspopup="menu"
                        open={opened}
                        onClick={() => disabled || setOpenedKey(opened ? null : key)}
                    >
                        <ChevronDownIcon style={styles?.splitIcon} />
                    </ToolbarSplit>
                </ToolbarItemContainer>
            ) : (
                <ToolbarItemContainer
                    role="button" tabIndex={0} aria-label={label} aria-disabled={disabled ?? false} aria-haspopup="menu"
                    type="split"
                    style={styles?.item}
                    onClick={() => disabled || setOpenedKey(opened ? null : key)}
                    className={`${opened ? 'open ' : ''}split`}
                >
                    <Icon style={styles?.icon} />
                    <ToolbarSplit open={opened}>
                        <ChevronDownIcon style={styles?.splitIcon} />
                    </ToolbarSplit>
                </ToolbarItemContainer>
            )}
            {opened && (
                <Layer hostId={layerId}>
                    <Toolbar {...menu} />
                </Layer>
            )}
        </TooltipHost>
    );
});

const ToolbarItem = memo<{
    item: ToolbarItemProps;
    styles?: ToolbarProps['styles'];
    layerId: string;
    openedKey: string | null;
    setOpenedKey: (key: string | null) => void;
}>(function ToolbarItem ({ item, styles, layerId, openedKey, setOpenedKey }) {
    if ('checked' in item) {
        return <ToolbarToggleButton item={item} styles={styles} />;
    }
    if ('menu' in item) {
        return <ToolbarSplitButton item={item} styles={styles} layerId={layerId} openedKey={openedKey} setOpenedKey={setOpenedKey} />;
    }
    return <ToolbarButton item={item} styles={styles} />;
});


export default ToolbarItem;
