import { Callout, DirectionalHint, Layer, TooltipHost } from "@fluentui/react";
import { ChevronDownIcon, Cog6ToothIcon, Cog8ToothIcon } from "@heroicons/react/24/solid";
import { useId } from "@fluentui/react-hooks";
import { HTMLAttributes, memo, useEffect, useRef } from "react";
import styled from "styled-components";
import ToolbarButton, { ToolbarButtonItem } from "./toolbar-button";
import ToolbarToggleButton, { ToolbarToggleButtonItem } from "./toolbar-toggle-button";
import ToolbarSelectButton, { ToolbarSelectButtonItem } from "./toolbar-select-button";
import { ToolbarContainer, ToolbarItemContainerElement, ToolbarSplitter, useHandlers } from "./components";
import Toolbar, { ToolbarProps } from ".";


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
    :hover > svg, :focus > svg {
        transform: translate(-50%, -20%);
    }
`;

const FormContainer = styled(ToolbarContainer)`
    width: max-content;
    height: max-content;
    background-color: #fff;
`;

export interface IToolbarItem {
    key: string;
    icon: (props: React.ComponentProps<'svg'> & {
        title?: string;
        titleId?: string;
    }) => JSX.Element;
    label: string;
    /** @default false */
    disabled?: boolean;
    menu?: ToolbarProps;
    form?: JSX.Element;
}

export const ToolbarItemSplitter = '-';

export type ToolbarItemProps = (
    | ToolbarButtonItem
    | ToolbarToggleButtonItem
    | ToolbarSelectButtonItem
    | typeof ToolbarItemSplitter
);

export interface IToolbarProps<P extends Exclude<ToolbarItemProps, typeof ToolbarItemSplitter> = Exclude<ToolbarItemProps, typeof ToolbarItemSplitter>> {
    item: P;
    styles?: ToolbarProps['styles'];
    layerId: string;
    openedKey: string | null;
    setOpenedKey: (key: string | null) => void;
}

export const ToolbarItemContainer = memo<{
    props: IToolbarProps;
    handlers: ReturnType<typeof useHandlers> | null;
    children: unknown;
} & HTMLAttributes<HTMLDivElement>>(function ToolbarItemContainer (
    {
        props: {
            item: { key, label, disabled = false, menu, form },
            styles, layerId, openedKey, setOpenedKey,
        },
        handlers,
        children,
        ...props
    }
) {
    const id = useId();
    const splitOnly = Boolean(form || menu) && handlers === null;

    const opened = Boolean(form || menu) && key === openedKey && !disabled;
    const openedRef = useRef(opened);
    openedRef.current = opened;

    const splitHandlers = useHandlers(() => {
        setOpenedKey(opened ? null : key);
    }, disabled ?? false, [' '], false);

    useEffect(() => {
        if (opened) {
            requestAnimationFrame(() => {
                const firstOption = document.getElementById(layerId)?.querySelector('*[role=button]');
                if (firstOption instanceof HTMLElement) {
                    // set tab position
                    firstOption.focus();
                    firstOption.blur();
                }
            });
        }
    }, [opened, layerId]);

    useEffect(() => {
        if (opened) {
            const close = (e?: unknown) => {
                if (!openedRef.current) {
                    return;
                }
                if (!e) {
                    setOpenedKey(null);
                } else if (e instanceof KeyboardEvent && e.key === 'Escape') {
                    setOpenedKey(null);
                } else if (e instanceof MouseEvent) {
                    setTimeout(() => {
                        if (openedRef.current) {
                            setOpenedKey(null);
                        }
                    }, 100);
                }
            };

            document.addEventListener('mousedown', close);
            document.addEventListener('keydown', close);

            return () => {
                document.removeEventListener('mousedown', close);
                document.removeEventListener('keydown', close);
            };
        }
    }, [setOpenedKey, opened]);

    return (
        <TooltipHost content={label}>
            <ToolbarItemContainerElement
                role="button" tabIndex={disabled ? undefined : 0} aria-label={label} aria-disabled={disabled ?? false}
                split={Boolean(form || menu)}
                style={styles?.item}
                className={opened ? 'open' : undefined}
                aria-haspopup={splitOnly ? 'menu' : 'false'}
                {...(splitOnly ? splitHandlers : handlers)}
                {...props}
                id={id}
            >
                {children}
                {form ? (
                    splitOnly ? (
                        <ToolbarSplit
                            open={opened}
                            {...splitHandlers}
                        >
                            <Cog6ToothIcon style={styles?.splitIcon}/>
                        </ToolbarSplit>
                    ) : (
                        <ToolbarSplit
                            open={opened}
                            role="button"
                            tabIndex={0}
                            {...splitHandlers}
                        >
                            <Cog6ToothIcon style={styles?.splitIcon}/>
                        </ToolbarSplit>
                    )
                ) : (
                    menu && (
                        splitOnly ? (
                            <ToolbarSplit
                                open={opened}
                                {...splitHandlers}
                            >
                                <ChevronDownIcon style={styles?.splitIcon} />
                            </ToolbarSplit>
                        ) : (
                            <ToolbarSplit
                                role="button" tabIndex={disabled ? undefined : 0} aria-label={label} aria-disabled={disabled} aria-haspopup="menu"
                                open={opened}
                                {...splitHandlers}
                            >
                                <Cog8ToothIcon style={styles?.splitIcon} />
                            </ToolbarSplit>
                        )
                    )
                )}
            </ToolbarItemContainerElement>
            {opened && (
                form ? (
                    <Callout
                        target={`#${id}`}
                        role="dialog"
                        gapSpace={0}
                        directionalHint={DirectionalHint.bottomCenter}
                        beakWidth={8}
                        styles={{
                            calloutMain: { background: 'unset' },
                            beakCurtain: { background: 'unset' },
                            beak: { backgroundColor: 'var(--bg-color-light)' }
                        }}
                    >
                        <FormContainer>
                            {form}
                        </FormContainer>
                    </Callout>
                ) : (menu && (
                    <Layer hostId={layerId}>
                        <Toolbar {...menu} />
                    </Layer>
                ))
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
    if (item === ToolbarItemSplitter) {
        return  <ToolbarSplitter />;
    }
    if ('checked' in item) {
        return <ToolbarToggleButton item={item} styles={styles} layerId={layerId} openedKey={openedKey} setOpenedKey={setOpenedKey} />;
    } else if ('options' in item) {
        return <ToolbarSelectButton item={item} styles={styles} layerId={layerId} openedKey={openedKey} setOpenedKey={setOpenedKey} />;
    }
    return <ToolbarButton item={item} styles={styles} layerId={layerId} openedKey={openedKey} setOpenedKey={setOpenedKey} />;
});


export default ToolbarItem;
