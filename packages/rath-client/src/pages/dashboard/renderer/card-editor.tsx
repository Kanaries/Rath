import { observer } from "mobx-react-lite";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import type { IFilter } from "../../../interfaces";
import { useGlobalStore } from "../../../store";
import { CardProviderProps } from "./card";
import MoveHandler from "./components/move-handler";
import ResizeHandler from "./components/resize-handler";
import DeleteButton from "./components/delete-button";


const DragBox = styled.div<{ canDrop: boolean }>`
    box-sizing: border-box;
    position: absolute;
    --c: ${({ canDrop }) => canDrop ? '#13a10e' : '#da3b01'};
    border: 1px solid var(--c);
    cursor: move;
    ::after {
        content: "";
        display: block;
        pointer-events: none;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: var(--c);
        opacity: 0.025;
    }
`;

const CardEditor: FC<CardProviderProps> = ({
    item, index, children, transformCoord, draftRef, canDrop, isSizeValid, operators, onFocus, focused, ratio,
}) => {
    const { dashboardStore } = useGlobalStore();
    const { moveCard, resizeCard } = operators;

    const { chart } = item.content;

    useEffect(() => {
        if (chart) {
            dashboardStore.runInAction(() => {
                chart.highlighter = [];
            });
            return () => {
                dashboardStore.runInAction(() => {
                    chart.highlighter = [];
                });
            };
        }
    }, [chart, dashboardStore]);

    const handleClick = useCallback(() => {
        onFocus?.();
    }, [onFocus]);
    const handleDoubleClick = useCallback(() => {
        const adjustSize = operators.adjustCardSize;
        if (adjustSize) {
            adjustSize('n');
            adjustSize('e');
            adjustSize('s');
            adjustSize('w');
        }
    }, [operators.adjustCardSize]);

    useEffect(() => {
        operators.fireUpdate?.();
    }, [
        operators,
        item.config.appearance, item.config.align,
        item.layout.x, item.layout.y, item.layout.w, item.layout.h,
        item.content.title, item.content.text,
        item.content.chart?.filters, item.content.chart?.selectors, item.content.chart?.subset,
        item.content.chart?.size.w, item.content.chart?.size.h,
    ]);

    // Move
    const [dragging, setDragging] = useState<null | { from: { x: number; y: number }; to: { x: number; y: number } }>(null);
    const dragDest = useMemo(() => dragging ? {
        x: dragging.to.x,
        y: dragging.to.y,
        w: item.layout.w,
        h: item.layout.h,
    } : null, [dragging, item.layout]);
    const readyToDrop = useMemo(() => dragDest ? canDrop(dragDest, index) : false, [dragDest, canDrop, index]);
    const handleDragStart = useCallback(() => {
        setDragging({
            from: { x: item.layout.x, y: item.layout.y },
            to: { x: item.layout.x, y: item.layout.y },
        });
    }, [item.layout.x, item.layout.y]);
    const handleDrag = useCallback((x: number, y: number) => {
        if (!dragging) {
            return;
        }
        setDragging({
            from: dragging.from,
            to: { x, y },
        });
    }, [dragging]);
    const handleDragEnd = useCallback(() => {
        if (!dragging) {
            return;
        }
        const dest = {
            x: dragging.to.x,
            y: dragging.to.y,
            w: item.layout.w,
            h: item.layout.h,
        };
        const readyToDrop = canDrop(dest, index);
        if (readyToDrop) {
            moveCard?.(index, dest.x, dest.y);
        }
        setDragging(null);
    }, [moveCard, dragging, item.layout, index, canDrop]);
    const handleDragCancel = useCallback(() => {
        setDragging(null);
    }, []);

    // Move
    const [resizing, setResizing] = useState<null | { w: number; h: number }>(null);
    const resizeDest = useMemo(() => resizing ? {
        x: item.layout.x,
        y: item.layout.y,
        w: resizing.w,
        h: resizing.h,
    } : null, [resizing, item.layout]);
    const readyToResize = useMemo(() => resizeDest ? (
        canDrop(resizeDest, index) && isSizeValid(resizeDest.w, resizeDest.h)
    ) : false, [resizeDest, canDrop, isSizeValid, index]);
    const handleResizeStart = useCallback(() => {
        setResizing({
            w: item.layout.w,
            h: item.layout.h,
        });
    }, [item.layout.w, item.layout.h]);
    const handleResize = useCallback((w: number, h: number) => {
        if (!resizing) {
            return;
        }
        setResizing({ w, h });
    }, [resizing]);
    const handleResizeEnd = useCallback(() => {
        if (!resizing) {
            return;
        }
        const dest = {
            x: item.layout.x,
            y: item.layout.y,
            w: resizing.w,
            h: resizing.h,
        };
        const readyToResize = canDrop(dest, index) && isSizeValid(dest.w, dest.h);
        if (readyToResize) {
            resizeCard?.(index, dest.w, dest.h);
        }
        setResizing(null);
    }, [resizeCard, canDrop, isSizeValid, resizing, item.layout, index]);
    const handleResizeCancel = useCallback(() => {
        setResizing(null);
    }, []);

    const handleFilter = useCallback((filters: Readonly<IFilter[]>) => {
        if (chart) {
            dashboardStore.runInAction(() => {
                chart.selectors = [...filters];
            });
        }
    }, [chart, dashboardStore]);

    const { removeCard } = operators;

    useEffect(() => {
        if (focused && removeCard) {
            const cb = (ev: KeyboardEvent) => {
                if (['Backspace'].includes(ev.key)) {
                    removeCard(index);
                }
            };
            document.body.addEventListener('keydown', cb);
            return () => document.body.removeEventListener('keydown', cb);
        }
    }, [focused, removeCard, index]);

    return children({
        content: focused ? (
            <>
                <MoveHandler
                    layout={item.layout}
                    transformCoord={transformCoord}
                    onDragStart={handleDragStart}
                    onDrag={handleDrag}
                    onDragEnd={handleDragEnd}
                    onDragCancel={handleDragCancel}
                />
                {dragDest && draftRef.current && createPortal(
                    <DragBox
                        canDrop={readyToDrop}
                        style={{
                            left: dragDest.x * ratio,
                            top: dragDest.y * ratio,
                            width: dragDest.w * ratio,
                            height: dragDest.h * ratio,
                        }}
                    />,
                    draftRef.current
                )}
                <ResizeHandler
                    layout={item.layout}
                    transformCoord={transformCoord}
                    onResizeStart={handleResizeStart}
                    onResize={handleResize}
                    onResizeEnd={handleResizeEnd}
                    onResizeCancel={handleResizeCancel}
                    adjustCardSize={operators.adjustCardSize}
                />
                {removeCard && (
                    <DeleteButton
                        remove={() => removeCard(index)}
                    />
                )}
                {resizeDest && draftRef.current && createPortal(
                    <DragBox
                        canDrop={readyToResize}
                        style={{
                            left: resizeDest.x * ratio,
                            top: resizeDest.y * ratio,
                            width: resizeDest.w * ratio,
                            height: resizeDest.h * ratio,
                        }}
                    />,
                    draftRef.current
                )}
            </>
        ) : null,
        onDoubleClick: handleDoubleClick,
        // onRootMouseDown(x, y) {
        //     // console.log({x,y})
        // },
        onClick: handleClick,
        onFilter: handleFilter,
        style: focused ? {
            zIndex: 1,
        } : undefined,
    });
};


export default observer(CardEditor);
