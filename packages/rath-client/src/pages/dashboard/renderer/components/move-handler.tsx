import { Icon } from "@fluentui/react";
import { FC, MouseEvent as MEvent, useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import type { DashboardCard } from "../../../../store/dashboardStore";


const Container = styled.div<{ dragging: boolean }>`
    position: absolute;
    left: 0;
    top: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border: 1px solid #8888;
    cursor: move;
    color: #0078d4;
    background-color: #ffffff;
    opacity: ${({ dragging }) => dragging ? 1 : 0.6};
    :hover {
        opacity: 1;
    }
    & * {
        pointer-events: none;
    }
`;

export interface MoveHandlerProps {
    layout: DashboardCard['layout'];
    transformCoord: (ev: { clientX: number; clientY: number }) => { x: number; y: number };
    onDragStart: () => void;
    onDrag: (x: number, y: number) => void;
    onDragEnd: (x: number, y: number) => void;
    onDragCancel: () => void;
}

const MoveHandler: FC<MoveHandlerProps> = ({ layout, transformCoord, onDragStart, onDrag, onDragEnd, onDragCancel }) => {
    const [dragging, setDragging] = useState<null | { offset: { x: number; y: number } }>(null);
    const handleMouseDown = useCallback((ev: MEvent<HTMLDivElement>) => {
        ev.stopPropagation();
        const pos = transformCoord(ev);
        setDragging({
            offset: {
                x: pos.x - layout.x,
                y: pos.y - layout.y,
            },
        });
        onDragStart();
    }, [transformCoord, onDragStart, layout.x, layout.y]);

    const isDragging = Boolean(dragging);

    useEffect(() => {
        if (isDragging) {
            const cb = (ev: MouseEvent) => {
                if (!dragging) {
                    return;
                }
                const pos = transformCoord(ev);
                switch (ev.type) {
                    case 'mouseup': {
                        onDragEnd(pos.x - dragging.offset.x, pos.y - dragging.offset.y);
                        setDragging(null);
                        break;
                    }
                    case 'mousemove': {
                        if (ev.buttons === 1) {
                            // left button pressed
                            onDrag(pos.x - dragging.offset.x, pos.y - dragging.offset.y);
                        } else {
                            onDragCancel();
                            setDragging(null);
                        }
                        break;
                    }
                    default: {
                        break;
                    }
                }
            };
            document.body.addEventListener('mouseup', cb);
            document.body.addEventListener('mousemove', cb);
            return () => {
                document.body.removeEventListener('mouseup', cb);
                document.body.removeEventListener('mousemove', cb);
            };
        }
    }, [isDragging, dragging, onDrag, onDragCancel, onDragEnd, transformCoord]);

    return (
        <Container
            dragging={isDragging}
            onMouseDown={handleMouseDown}
        >
            <Icon iconName="Move" />
        </Container>
    );
};


export default MoveHandler;
