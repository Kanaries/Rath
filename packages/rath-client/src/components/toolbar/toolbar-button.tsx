import { TooltipHost } from "@fluentui/react";
import { memo } from "react";
import { IToolbarItem, IToolbarProps, ToolbarItemContainer } from "./toolbar-item";
import { useHandlers } from "./components";


export interface ToolbarButtonItem extends IToolbarItem {
    onClick?: () => void;
}

const ToolbarButton = memo<IToolbarProps<ToolbarButtonItem>>(function ToolbarButton(props) {
    const { item, styles } = props;
    const { icon: Icon, label, disabled, onClick } = item;
    const handlers = useHandlers(() => onClick?.(), disabled ?? false);

    return (
        <TooltipHost content={label} styles={{ root: { display: 'inline-flex' } }}>
            <ToolbarItemContainer
                props={props}
                handlers={onClick ? handlers : null}
            >
                <Icon style={styles?.icon} />
            </ToolbarItemContainer>
        </TooltipHost>
    );
});


export default ToolbarButton;
