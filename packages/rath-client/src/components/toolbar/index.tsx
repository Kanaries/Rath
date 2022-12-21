import { LayerHost } from "@fluentui/react";
import { useId } from "@fluentui/react-hooks";
import { CSSProperties, memo, useState } from "react";
import styled from "styled-components";
import { ToolbarContainer, ToolbarSplitter } from "./components";
import ToolbarItem, { ToolbarItemProps, ToolbarItemSplitter } from "./toolbar-item";


const Root = styled.div`
    width: 100%;
`;

export interface ToolbarProps {
    items: ToolbarItemProps[];
    styles?: Partial<{
        root: CSSProperties;
        container: CSSProperties;
        item: CSSProperties;
        icon: CSSProperties;
        splitIcon: CSSProperties;
    }>;
}

const Toolbar = memo<ToolbarProps>(function Toolbar ({ items, styles }) {
    const layerId = useId();
    const [openedKey, setOpenedKey] = useState<string | null>(null);

    return (
        <Root style={styles?.root}>
            <ToolbarContainer style={styles?.container}>
                {items.map((item, i) => {
                    if (item === ToolbarItemSplitter) {
                        return <ToolbarSplitter key={i} />;
                    }
                    return (
                        <ToolbarItem
                            key={item.key}
                            item={item}
                            styles={styles}
                            layerId={layerId}
                            openedKey={openedKey}
                            setOpenedKey={setOpenedKey}
                        />
                    );
                })}
            </ToolbarContainer>
            <LayerHost id={layerId} />
        </Root>
    );
});


export default Toolbar;
export type { ToolbarItemProps };
