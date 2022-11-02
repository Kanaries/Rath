import { observer } from "mobx-react-lite";
import { FC, useMemo } from "react";
import styled from "styled-components";
import type { DashboardCard, DashboardDocumentOperators } from "../../../store/dashboardStore";
import { scaleRatio } from "../dashboard-draft";
import CardDisplay from "./card-display";
import CardEditor from "./card-editor";

export interface CardProps {
    card: DashboardCard;
    index: number;
    /** @default undefined */
    editor?: Omit<CardProviderProps, 'children' | 'transformCoord' | 'item' | 'index'> | undefined;
    transformCoord: (ev: { clientX: number; clientY: number }) => { x: number; y: number };
}

export interface CardProvider {
    content: JSX.Element | null;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onRootMouseDown: (x: number, y: number) => void;
    onDoubleClick: () => void;
}

export interface CardProviderProps {
    children: (provider: Partial<CardProvider>) => JSX.Element;
    transformCoord: (ev: { clientX: number; clientY: number }) => { x: number; y: number };
    draftRef: { current: HTMLElement | null };
    index: number;
    item: Readonly<DashboardCard>;
    canDrop: (layout: DashboardCard['layout'], except?: number) => boolean;
    isSizeValid: (w: number, h: number) => boolean;
    operators: Partial<DashboardDocumentOperators & {
        adjustCardSize: (dir: 'n' | 'e' | 's' | 'w') => void;
    }>;
}

const CardBox = styled.div`
    box-sizing: border-box;
    user-select: none;
    position: absolute;
    border: 1px solid #8888;
    backdrop-filter: blur(1px);
    cursor: default;
`;

const Card: FC<CardProps> = ({ card, editor, transformCoord, index }) => {
    const Provider = useMemo(() => {
        return editor ? CardEditor : CardDisplay;
    }, [editor]);

    return (
        <Provider
            {...editor ?? {
                draftRef: { current: null },
                canDrop: () => false,
                isSizeValid: () => false,
                operators: {},
            }}
            transformCoord={transformCoord}
            item={card}
            index={index}
        >
            {provider => (
                <CardBox
                    onMouseEnter={provider.onMouseEnter}
                    onMouseLeave={provider.onMouseLeave}
                    onMouseDown={e => {
                        e.stopPropagation();
                        const pos = transformCoord(e);
                        provider.onRootMouseDown?.(pos.x, pos.y);
                    }}
                    onDoubleClick={provider.onDoubleClick}
                    style={{
                        left: card.layout.x * scaleRatio,
                        top: card.layout.y * scaleRatio,
                        width: card.layout.w * scaleRatio,
                        height: card.layout.h * scaleRatio,
                    }}
                >
                    {provider.content}
                </CardBox>
            )}
        </Provider>
    );
};


export default observer(Card);
