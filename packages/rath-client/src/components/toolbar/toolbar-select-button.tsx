import { Callout, DirectionalHint, TooltipHost } from "@fluentui/react";
import { memo, useEffect, useRef } from "react";
import styled from "styled-components";
import produce from "immer";
import { useId } from "@fluentui/react-hooks";
import { IToolbarItem, IToolbarProps, ToolbarItemContainer } from "./toolbar-item";
import { ToolbarContainer, useHandlers, ToolbarItemContainerElement } from "./components";


const OptionGroup = styled(ToolbarContainer)`
    flex-direction: column;
    width: max-content;
    height: max-content;
    --aside: 8px;
`;

const Option = styled(ToolbarItemContainerElement)`
    width: unset;
    height: var(--height);
    position: relative;
    font-size: 95%;
    padding-left: var(--aside);
    padding-right: 1em;
    align-items: center;
    &[aria-selected="true"] {
        ::before {
            display: block;
            position: absolute;
            content: "";
            left: calc(var(--aside) / 2);
            width: calc(var(--aside) / 2);
            top: calc(var(--height) / 8);
            bottom: calc(var(--height) / 8);
            background-color: #3064df;
        }
    }
    > label {
        user-select: none;
        pointer-events: none;
    }
`;

const TriggerFlag = styled.span`
    pointer-events: none;
    position: absolute;
    bottom: 0;
    left: 50%;
`;

export interface ToolbarSelectButtonItem<T extends string = string> extends IToolbarItem {
    options: {
        key: T;
        icon: (props: React.SVGProps<SVGSVGElement> & {
            title?: string | undefined;
            titleId?: string | undefined;
        }) => JSX.Element;
        label: string;
        /** @default false */
        disabled?: boolean;
    }[];
    value: T;
    onSelect: (value: T) => void;
}

const ToolbarSelectButton = memo<IToolbarProps<ToolbarSelectButtonItem>>(function ToolbarSelectButton(props) {
    const id = useId();
    const { item, styles, openedKey, setOpenedKey } = props;
    const { icon: Icon, label, disabled, options, value, onSelect } = item;
    
    const opened = openedKey === id;
    const handlers = useHandlers(() => {
        setOpenedKey(opened ? null : id);
    }, disabled ?? false);

    const openedRef = useRef(opened);
    openedRef.current = opened;

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

    const currentOption = options.find(opt => opt.key === value);
    const CurrentIcon = currentOption?.icon;

    return (
        <TooltipHost content={label} styles={{ root: { display: 'inline-flex', position: 'relative' } }}>
            <ToolbarItemContainer
                props={produce(props, draft => {
                    if (currentOption) {
                        draft.item.label = `${draft.item.label}: ${currentOption.label}`;
                    }
                })}
                handlers={handlers}
                aria-haspopup="listbox"
            >
                <Icon style={styles?.icon} />
                {CurrentIcon && (
                    <CurrentIcon
                        style={{
                            ...styles?.icon,
                            position: 'absolute',
                            left: 'calc(var(--height) - var(--icon-size) * 1.2)',
                            bottom: 'calc((var(--height) - var(--icon-size)) * 0.1)',
                            width: 'calc(var(--icon-size) * 0.6)',
                            height: 'calc(var(--icon-size) * 0.6)',
                            margin: 'calc((var(--height) - var(--icon-size)) * 0.2)',
                            filter: 'drop-shadow(0 0 0.5px var(--background-color)) '.repeat(4),
                            pointerEvents: 'none',
                            color: '#3b72f3',
                        }}
                    />
                )}
                <TriggerFlag aria-hidden id={id} />
            </ToolbarItemContainer>
            {opened && (
                <Callout target={`#${id}`} role="dialog" gapSpace={0} directionalHint={DirectionalHint.bottomCenter} beakWidth={8} styles={{ calloutMain: { background: 'unset' }, beakCurtain: { background: 'unset' }, beak: { backgroundColor: '#121212' } }}>
                    <OptionGroup role="listbox" aria-activedescendant={`${id}::${value}`} aria-describedby={id} aria-disabled={disabled}>
                        {options.map((option, idx, arr) => {
                            const selected = option.key === value;
                            const OptionIcon = option.icon;
                            const optionId = `${id}::${value}`;
                            const prev = arr[(idx + arr.length - 1) % arr.length];
                            const next = arr[(idx + 1) % arr.length];
                            return (
                                <Option
                                    key={option.key}
                                    id={optionId}
                                    role="option"
                                    aria-disabled={option.disabled ?? false}
                                    aria-selected={selected}
                                    split={false}
                                    tabIndex={0}
                                    onFocus={() => onSelect(option.key)}
                                    onClick={() => {
                                        onSelect(option.key);
                                        setOpenedKey(null);
                                    }}
                                    onKeyDown={e => {
                                        if (e.key === 'ArrowDown') {
                                            onSelect(next.key);
                                        } else if (e.key === 'ArrowUp') {
                                            onSelect(prev.key);
                                        }
                                    }}
                                    ref={e => {
                                        if (e && selected) {
                                            e.focus();
                                        }
                                    }}
                                >
                                    <OptionIcon style={styles?.icon} />
                                    <label>{option.label}</label>
                                </Option>
                            );
                        })}
                    </OptionGroup>
                </Callout>
            )}
        </TooltipHost>
    );
});


export default ToolbarSelectButton;
