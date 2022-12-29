import { TooltipHost } from "@fluentui/react";
import { memo } from "react";
import styled from "styled-components";
import { IToolbarItem, IToolbarProps, ToolbarItemContainer } from "./toolbar-item";
import { useHandlers } from "./components";


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
    background-color: #F7F7F722;
    > svg, i {
        width: var(--icon-size);
        height: var(--icon-size);
        position: absolute;
        color: ${({ checked }) => checked ? '#EDEFF4' : 'var(--color)'};
        --shadow-color: ${({ checked }) => checked ? '#2956bf66' : '#9ba1ab66' || '#52576366'};
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
        background-color: var(--blue-dark);
        transform: ${({ checked }) => checked ? 'translate(0)' : 'translateX(-100%)'};
        transition: transform 80ms;
    }
`;

export interface ToolbarToggleButtonItem extends IToolbarItem {
    checked: boolean;
    onChange: (checked: boolean) => void;
}

const ToolbarToggleButton = memo<IToolbarProps<ToolbarToggleButtonItem>>(function ToolbarToggleButton(props) {
    const { item, styles } = props;
    const { icon: Icon, label, disabled, checked, onChange } = item;
    const handlers = useHandlers(() => onChange(!checked), disabled ?? false);

    return (
        <TooltipHost content={label} styles={{ root: { display: 'inline-flex' } }}>
            <ToolbarItemContainer
                props={props}
                handlers={handlers}
                role="checkbox"
                aria-checked={checked}
            >
                <ToggleContainer checked={checked}>
                    <Icon style={styles?.icon} />
                </ToggleContainer>
            </ToolbarItemContainer>
        </TooltipHost>
    );
});


export default ToolbarToggleButton;
