import { LayerHost } from "@fluentui/react";
import { useId } from "@fluentui/react-hooks";
import { CSSProperties, KeyboardEvent, memo, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import ToolbarItem, { ToolbarItemProps } from "./toolbar-item";


export const useHandlers = (action: () => void, disabled: boolean, triggerKeys: string[] = ['Enter']) => {
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
        onClick: () => {
            actionRef.current();
        },
        onKeyDown: (ev: KeyboardEvent) => {
            if (triggerKeysRef.current.includes(ev.key)) {
                actionRef.current();
            }
        },
    }), []);
};

const Root = styled.div`
    width: 100%;
`;

const ToolbarContainer = styled.div`
    --height: 36px;
    --icon-size: 18px;
    width: 100%;
    height: var(--height);
    background: #D7D7D744;
    /* box-shadow: 0px 1px 3px 1px rgba(136, 136, 136, 0.05); */
    border-radius: 2px;
    overflow: hidden;
    display: flex;
    flex-direction: row;
    > * {
        flex-grow: 0;
        flex-shrink: 0;
    }
`;

const ToolbarSplitter = styled.div`
    display: inline-block;
    margin: calc(var(--height) / 6) calc(var(--icon-size) / 4);
    height: calc(var(--height) * 2 / 3);
    width: 1px;
    background: #E2E2E2;
`;

export const ToolbarItemSplitter = '-';

export interface ToolbarProps {
    items: (ToolbarItemProps | typeof ToolbarItemSplitter)[];
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
            <ToolbarContainer style={styles?.container} onClick={e => e.stopPropagation()}>
                {items.map((item, i) => {
                    if (item === ToolbarItemSplitter) {
                        return <ToolbarSplitter key={i} />
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
