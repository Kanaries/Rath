import { observer } from 'mobx-react-lite';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import type { IFilter } from '../../../interfaces';
import { useGlobalStore } from '../../../store';
import { CardProviderProps, RefLine } from './card';
import MoveHandler from './components/move-handler';
import ResizeHandler from './components/resize-handler';
import DeleteButton from './components/delete-button';

const DragBox = styled.div<{ canDrop: boolean }>`
    box-sizing: border-box;
    position: absolute;
    --c: ${({ canDrop }) => (canDrop ? '#13a10e' : '#da3b01')};
    border: 1px solid var(--c);
    cursor: move;
    z-index: 999;
    ::after {
        content: '';
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

const RefLineOutline = styled.div<{ direction: 'x' | 'y'; matched: boolean }>`
    pointer-events: none;
    position: absolute;
    width: ${({ direction, matched }) => (direction === 'x' ? `${matched ? 3 : 1}px` : '100%')};
    height: ${({ direction, matched }) => (direction === 'y' ? `${matched ? 3 : 1}px` : '100%')};
    left: 0;
    top: 0;
    background-color: ${({ matched }) => (matched ? '#13a10e' : '#ebc310')};
    opacity: 0.5;
    z-index: 998;
`;

const AUTO_ALIGN_THRESHOLD = 4;

const CardEditor: FC<CardProviderProps> = ({
    item,
    index,
    children,
    transformCoord,
    draftRef,
    canDrop,
    isSizeValid,
    operators,
    onFocus,
    focused,
    ratio,
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
    // const handleDoubleClick = useCallback(() => {
    //     const adjustSize = operators.adjustCardSize;
    //     if (adjustSize) {
    //         adjustSize('n');
    //         adjustSize('e');
    //         adjustSize('s');
    //         adjustSize('w');
    //     }
    // }, [operators.adjustCardSize]);

    useEffect(() => {
        operators.fireUpdate?.();
    }, [
        operators,
        item.config.appearance,
        item.config.align,
        item.layout.x,
        item.layout.y,
        item.layout.w,
        item.layout.h,
        item.content.title,
        item.content.text,
        item.content.chart?.filters,
        item.content.chart?.selectors,
        item.content.chart?.subset,
        item.content.chart?.size.w,
        item.content.chart?.size.h,
    ]);

    const [refLines, setRefLines] = useState<RefLine[]>([]);

    // Move
    const [dragging, setDragging] = useState<null | { from: { x: number; y: number }; to: { x: number; y: number } }>(null);
    const dragDest = useMemo(
        () =>
            dragging
                ? {
                      x: dragging.to.x,
                      y: dragging.to.y,
                      w: item.layout.w,
                      h: item.layout.h,
                  }
                : null,
        [dragging, item.layout]
    );
    const readyToDrop = useMemo(() => (dragDest ? canDrop(dragDest, index) : false), [dragDest, canDrop, index]);
    const handleDragStart = useCallback(() => {
        setDragging({
            from: { x: item.layout.x, y: item.layout.y },
            to: { x: item.layout.x, y: item.layout.y },
        });
    }, [item.layout.x, item.layout.y]);
    const handleDrag = useCallback(
        (x: number, y: number) => {
            if (!dragging) {
                return;
            }
            const refLines = operators.getRefLines?.(index);
            if (refLines) {
                setRefLines(refLines);
            }
            setDragging({
                from: dragging.from,
                to: { x, y },
            });
        },
        [dragging, operators, index]
    );
    const handleDragCancel = useCallback(() => {
        setDragging(null);
    }, []);

    // Resize
    const [resizing, setResizing] = useState<null | { w: number; h: number }>(null);
    const resizeDest = useMemo(
        () =>
            resizing
                ? {
                      x: item.layout.x,
                      y: item.layout.y,
                      w: resizing.w,
                      h: resizing.h,
                  }
                : null,
        [resizing, item.layout]
    );
    const readyToResize = useMemo(
        () => (resizeDest ? canDrop(resizeDest, index) && isSizeValid(resizeDest.w, resizeDest.h) : false),
        [resizeDest, canDrop, isSizeValid, index]
    );
    const handleResizeStart = useCallback(() => {
        setResizing({
            w: item.layout.w,
            h: item.layout.h,
        });
    }, [item.layout.w, item.layout.h]);
    const handleResize = useCallback(
        (w: number, h: number) => {
            if (!resizing) {
                return;
            }
            const refLines = operators.getRefLines?.(index);
            if (refLines) {
                setRefLines(refLines);
            }
            setResizing({ w, h });
        },
        [resizing, index, operators]
    );
    const handleResizeCancel = useCallback(() => {
        setResizing(null);
    }, []);

    const handleFilter = useCallback(
        (filters: Readonly<IFilter[]>) => {
            if (chart) {
                dashboardStore.runInAction(() => {
                    chart.selectors = [...filters];
                });
            }
        },
        [chart, dashboardStore]
    );

    const isDraggingOrResizing = Boolean(dragging) || Boolean(resizing);
    useEffect(() => {
        setRefLines([]);
    }, [isDraggingOrResizing]);

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

    const curPositionToPut = useMemo<typeof item.layout | null>(() => {
        const realPos = dragDest ?? resizeDest ?? null;
        if (realPos) {
            if (!canDrop(realPos, index) || !isSizeValid(realPos.w, realPos.h)) {
                return realPos;
            }
            const availableLines = refLines
                .reduce<
                    {
                        target: keyof typeof item.layout;
                        value: number;
                        distance: number;
                        score: number;
                    }[]
                >((list, line) => {
                    if (line.direction === 'x') {
                        const x1 = realPos.x;
                        const x2 = realPos.x + realPos.w;
                        const diffX1 = Math.abs(line.position - x1);
                        if (diffX1 <= AUTO_ALIGN_THRESHOLD) {
                            list.push({
                                target: 'x',
                                value: line.position,
                                distance: diffX1,
                                score: line.score,
                            });
                        }
                        const diffX2 = Math.abs(line.position - x2);
                        if (diffX2 <= AUTO_ALIGN_THRESHOLD) {
                            list.push(
                                dragDest
                                    ? {
                                          target: 'x',
                                          value: line.position - item.layout.w,
                                          distance: diffX2,
                                          score: line.score,
                                      }
                                    : {
                                          target: 'w',
                                          value: line.position - item.layout.x,
                                          distance: diffX2,
                                          score: line.score,
                                      }
                            );
                        }
                    } else {
                        const y1 = realPos.y;
                        const y2 = realPos.y + realPos.h;
                        const diffY1 = Math.abs(line.position - y1);
                        if (diffY1 <= AUTO_ALIGN_THRESHOLD) {
                            list.push({
                                target: 'y',
                                value: line.position,
                                distance: diffY1,
                                score: line.score,
                            });
                        }
                        const diffY2 = Math.abs(line.position - y2);
                        if (diffY2 <= AUTO_ALIGN_THRESHOLD) {
                            list.push(
                                dragDest
                                    ? {
                                          target: 'y',
                                          value: line.position - item.layout.h,
                                          distance: diffY2,
                                          score: line.score,
                                      }
                                    : {
                                          target: 'h',
                                          value: line.position - item.layout.y,
                                          distance: diffY2,
                                          score: line.score,
                                      }
                            );
                        }
                    }
                    return list;
                }, [])
                .filter((link) => {
                    const target = {
                        ...item.layout,
                        [link.target]: link.value,
                    };
                    return canDrop(target, index);
                });
            let target = { ...realPos };
            let xAppliedDist = Infinity;
            let yAppliedDist = Infinity;
            for (const line of availableLines) {
                switch (line.target) {
                    case 'x': {
                        if (dragDest && line.distance < xAppliedDist) {
                            const next = { ...target, x: line.value };
                            if (canDrop(next, index)) {
                                xAppliedDist = line.distance;
                                target = next;
                            }
                        }
                        break;
                    }
                    case 'y': {
                        if (dragDest && line.distance < yAppliedDist) {
                            const next = { ...target, y: line.value };
                            if (canDrop(next, index)) {
                                yAppliedDist = line.distance;
                                target = next;
                            }
                        }
                        break;
                    }
                    case 'w': {
                        if (resizeDest && line.distance < xAppliedDist) {
                            const next = { ...target, w: line.value };
                            if (canDrop(next, index) && isSizeValid(next.w, next.h)) {
                                xAppliedDist = line.distance;
                                target = next;
                            }
                        }
                        break;
                    }
                    case 'h': {
                        if (resizeDest && line.distance < yAppliedDist) {
                            const next = { ...target, h: line.value };
                            if (canDrop(next, index) && isSizeValid(next.w, next.h)) {
                                yAppliedDist = line.distance;
                                target = next;
                            }
                        }
                        break;
                    }
                }
            }
            return target;
        }
        return null;
    }, [dragDest, resizeDest, refLines, item, canDrop, isSizeValid, index]);

    const readyToPut = dragDest ? readyToDrop : readyToResize;

    const handleResizeEnd = useCallback(() => {
        setResizing(null);
        if (!curPositionToPut || !readyToPut) {
            return;
        }
        const dest = {
            x: item.layout.x,
            y: item.layout.y,
            w: curPositionToPut.w,
            h: curPositionToPut.h,
        };
        resizeCard?.(index, dest.w, dest.h);
    }, [curPositionToPut, readyToPut, resizeCard, item.layout, index]);

    const handleDragEnd = useCallback(() => {
        setDragging(null);
        if (!curPositionToPut || !readyToPut) {
            return;
        }
        const dest = {
            x: curPositionToPut.x,
            y: curPositionToPut.y,
            w: item.layout.w,
            h: item.layout.h,
        };
        moveCard?.(index, dest.x, dest.y);
    }, [curPositionToPut, readyToPut, moveCard, item.layout, index]);

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
                <ResizeHandler
                    layout={item.layout}
                    transformCoord={transformCoord}
                    onResizeStart={handleResizeStart}
                    onResize={handleResize}
                    onResizeEnd={handleResizeEnd}
                    onResizeCancel={handleResizeCancel}
                    adjustCardSize={operators.adjustCardSize}
                />
                {removeCard && <DeleteButton remove={() => removeCard(index)} />}
                {curPositionToPut &&
                    draftRef.current &&
                    createPortal(
                        <DragBox
                            canDrop={readyToPut}
                            style={{
                                left: curPositionToPut.x * ratio,
                                top: curPositionToPut.y * ratio,
                                width: curPositionToPut.w * ratio,
                                height: curPositionToPut.h * ratio,
                            }}
                        />,
                        draftRef.current
                    )}
            </>
        ) : null,
        canvasContent: (
            <>
                {curPositionToPut &&
                    refLines.map((line, i) => (
                        <RefLineOutline
                            key={i}
                            direction={line.direction}
                            matched={
                                readyToPut && line.direction === 'x'
                                    ? [curPositionToPut.x, curPositionToPut.x + curPositionToPut.w].includes(line.position)
                                    : [curPositionToPut.y, curPositionToPut.y + curPositionToPut.h].includes(line.position)
                            }
                            style={{
                                [line.direction === 'x' ? 'left' : 'top']: line.position * ratio,
                            }}
                        />
                    ))}
            </>
        ),
        onClick: handleClick,
        onFilter: handleFilter,
        style: focused
            ? {
                  zIndex: 1,
              }
            : undefined,
    });
};

export default observer(CardEditor);
