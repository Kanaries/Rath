import { observer } from "mobx-react-lite";
import type { FC } from "react";
import styled from "styled-components";
import type { DashboardCard } from "../../../store/dashboardStore";


export const scaleRatio = Math.min(window.innerWidth, window.innerHeight) / 256;

export interface CardProps {
    card: DashboardCard;
    /** @default false */
    readOnly?: boolean;
}

const CardBox = styled.div`
    box-sizing: border-box;
    user-select: none;
    position: absolute;
    border: 1px solid #8888;
    backdrop-filter: blur(1px);
`;

const Card: FC<CardProps> = ({ card, readOnly = false }) => {
    return (
        <CardBox
            onMouseDown={e => e.stopPropagation()}
            style={{
                left: card.layout.x * scaleRatio,
                top: card.layout.y * scaleRatio,
                width: card.layout.w * scaleRatio,
                height: card.layout.h * scaleRatio,
                cursor: readOnly ? 'default' : 'pointer',
            }}
        >
            我是 placeholder
        </CardBox>
    );
};


export default observer(Card);
