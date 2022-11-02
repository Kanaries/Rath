import { FC, MouseEvent as MEvent, useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import type { DashboardCard } from "../../../../store/dashboardStore";


const Resizer = styled.div`
    position: absolute;
    bottom: 0;
    right: 0;
    transform: translate(50%, 50%);
    width: 12px;
    height: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border: 1px solid #8888;
    cursor: nwse-resize;
    background-color: #ffffff;
`;

const Adjuster = styled.div`
    position: absolute;
    width: 8px;
    height: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background-color: #888;
`;

export interface ResizeHandlerProps {
    layout: DashboardCard['layout'];
    transformCoord: (ev: { clientX: number; clientY: number }) => { x: number; y: number };
    onResizeStart: () => void;
    onResize: (x: number, y: number) => void;
    onResizeEnd: (x: number, y: number) => void;
    onResizeCancel: () => void;
    adjustCardSize?: ( dir: 'n' | 'e' | 's' | 'w') => void;
}

const ResizeHandler: FC<ResizeHandlerProps> = ({
    layout, transformCoord, onResizeStart, onResize, onResizeEnd, onResizeCancel, adjustCardSize,
}) => {
    const [dragging, setDragging] = useState<boolean>(false);
    const handleMouseDown = useCallback((ev: MEvent<HTMLDivElement>) => {
        ev.stopPropagation();
        setDragging(true);
        onResizeStart();
    }, [onResizeStart]);

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
                        onResizeEnd(pos.x - layout.x, pos.y - layout.y);
                        setDragging(false);
                        break;
                    }
                    case 'mousemove': {
                        if (ev.buttons === 1) {
                            // left button pressed
                            onResize(pos.x - layout.x, pos.y - layout.y);
                        } else {
                            onResizeCancel();
                            setDragging(false);
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
    }, [isDragging, dragging, onResize, onResizeCancel, onResizeEnd, transformCoord, layout.x, layout.y]);

    return (
        <>
            <Resizer onMouseDown={handleMouseDown} />
            {adjustCardSize && (
                <>
                    <Adjuster
                        style={{
                            bottom: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            cursor: 'n-resize',
                        }}
                        onClick={e => {
                            e.stopPropagation();
                            adjustCardSize('n');
                        }}
                        onMouseDown={e => e.stopPropagation()}
                    />
                    <Adjuster
                        style={{
                            left: '100%',
                            bottom: '100%',
                            cursor: 'ne-resize',
                        }}
                        onClick={e => {
                            e.stopPropagation();
                            adjustCardSize('n');
                            adjustCardSize('e');
                        }}
                        onMouseDown={e => e.stopPropagation()}
                    />
                    <Adjuster
                        style={{
                            left: '100%',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            cursor: 'e-resize',
                        }}
                        onClick={e => {
                            e.stopPropagation();
                            adjustCardSize('e');
                        }}
                        onMouseDown={e => e.stopPropagation()}
                    />
                    <Adjuster
                        style={{
                            bottom: '-5px',
                            right: '-5px',
                            transform: 'translate(100%, 100%)',
                            cursor: 'se-resize',
                        }}
                        onClick={e => {
                            e.stopPropagation();
                            adjustCardSize('e');
                            adjustCardSize('s');
                        }}
                        onMouseDown={e => e.stopPropagation()}
                    />
                    <Adjuster
                        style={{
                            top: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            cursor: 's-resize',
                        }}
                        onClick={e => {
                            e.stopPropagation();
                            adjustCardSize('s');
                        }}
                        onMouseDown={e => e.stopPropagation()}
                    />
                    <Adjuster
                        style={{
                            right: '100%',
                            top: '100%',
                            cursor: 'sw-resize',
                        }}
                        onClick={e => {
                            e.stopPropagation();
                            adjustCardSize('s');
                            adjustCardSize('w');
                        }}
                        onMouseDown={e => e.stopPropagation()}
                    />
                    <Adjuster
                        style={{
                            right: '100%',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            cursor: 'w-resize',
                        }}
                        onClick={e => {
                            e.stopPropagation();
                            adjustCardSize('w');
                        }}
                        onMouseDown={e => e.stopPropagation()}
                    />
                    <Adjuster
                        style={{
                            right: '100%',
                            bottom: '100%',
                            cursor: 'nw-resize',
                        }}
                        onClick={e => {
                            e.stopPropagation();
                            adjustCardSize('w');
                            adjustCardSize('n');
                        }}
                        onMouseDown={e => e.stopPropagation()}
                    />
                </>
            )}
        </>
    );
};


export default ResizeHandler;
