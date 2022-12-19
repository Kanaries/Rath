import { observer } from 'mobx-react-lite';
import { FC, MouseEvent as MEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { useGlobalStore } from '../../store';
import { DashboardCard } from '../../store/dashboardStore';
import DashboardPanel from './dashboard-panel';
import DashboardRenderer, { transformCoord } from './renderer';
import type { RefLine } from './renderer/card';
import { MIN_CARD_SIZE } from './renderer/constant';

const Container = styled.div`
    flex-grow: 1;
    flex-shrink: 1;
    overflow: hidden;
    display: flex;
    flex-direction: row;
    > .draft {
        flex-grow: 1;
        flex-shrink: 1;
        overflow: auto;
    }
`;

const DragBox = styled.div<{ canDrop: boolean }>`
    box-sizing: border-box;
    position: absolute;
    --c: ${({ canDrop }) => (canDrop ? '#13a10e' : '#da3b01')};
    border: 1px solid var(--c);
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

export interface DashboardDraftProps {
    cursor: number;
    mode: 'edit' | 'preview';
    ratio: number;
    sampleSize: number;
}

const checkOverlap = (layout1: DashboardCard['layout'], layout2: DashboardCard['layout']): boolean => {
    return [
        [layout1, layout2],
        [layout2, layout1],
    ].some(([a, b]) => {
        const x1 = a.x + 0.1;
        const x2 = a.x + a.w - 0.1;
        const y1 = a.y + 0.1;
        const y2 = a.y + a.h - 0.1;
        for (const [x, y] of [
            [x1, y1],
            [x1, y2],
            [x2, y1],
            [x2, y2],
        ]) {
            if (b.x < x && b.x + b.w > x && b.y < y && b.y + b.h > y) {
                return true;
            }
        }
        return false;
    });
};

const DashboardDraft: FC<DashboardDraftProps> = ({ cursor, mode, ratio: r, sampleSize }) => {
    const { dashboardStore } = useGlobalStore();
    const page = dashboardStore.pages[cursor];
    const { operators } = dashboardStore.fromPage(cursor);
    const { addCard, moveCard, resizeCard } = operators;

    const draftRef = useRef<HTMLDivElement>(null);

    const [focus, setFocus] = useState<null | number>(null);

    useEffect(() => {
        setFocus(null);
    }, [page.cards.length, mode]);

    const handleClick = useCallback(() => {
        setFocus(null);
    }, []);

    const [dragging, setDragging] = useState<null | { from: { x: number; y: number }; to: { x: number; y: number } }>(null);

    const canDrop = useCallback(
        (layout: DashboardCard['layout'], except?: number) => {
            // 判断出界
            if (layout.x < 0 || layout.x + layout.w > page.config.size.w) {
                return false;
            } else if (layout.y < 0 || layout.y + layout.h > page.config.size.h) {
                return false;
            }
            // 判断重叠
            for (let i = 0; i < page.cards.length; i += 1) {
                if (i === except) {
                    continue;
                } else if (checkOverlap(page.cards[i].layout, layout)) {
                    return false;
                }
            }
            return true;
        },
        [page.cards, page.config.size.w, page.config.size.h]
    );

    const isSizeValid = useCallback((w: number, h: number) => {
        return w >= MIN_CARD_SIZE && h >= MIN_CARD_SIZE;
    }, []);

    const dragDest = useMemo(
        () =>
            dragging
                ? {
                      x: Math.min(dragging.from.x, dragging.to.x),
                      y: Math.min(dragging.from.y, dragging.to.y),
                      w: Math.abs(dragging.from.x - dragging.to.x),
                      h: Math.abs(dragging.from.y - dragging.to.y),
                  }
                : null,
        [dragging]
    );

    const handleDragEnd = useCallback(
        (pos: { x: number; y: number }) => {
            if (!dragging) {
                return;
            }
            setDragging(null);
            const w = Math.abs(dragging.from.x - pos.x);
            const h = Math.abs(dragging.from.y - pos.y);
            const layout = {
                x: Math.min(dragging.from.x, pos.x),
                y: Math.min(dragging.from.y, pos.y),
                w,
                h,
            };
            if (canDrop(layout) && isSizeValid(w, h)) {
                addCard(layout);
            }
        },
        [dragging, addCard, canDrop, isSizeValid]
    );

    const handleDragCancel = useCallback(() => {
        setDragging(null);
    }, []);

    useEffect(() => {
        if (dragging) {
            const dragEnd = (ev: MouseEvent) => {
                if (ev.type === 'mouseup' && draftRef.current) {
                    const { x, y } = transformCoord(draftRef.current, ev, page.config.size.w, page.config.size.h, r);
                    handleDragEnd({ x, y });
                } else if (ev.type === 'mousemove' && ev.buttons !== 1) {
                    handleDragCancel();
                }
            };
            document.body.addEventListener('mouseup', dragEnd);
            document.body.addEventListener('mousemove', dragEnd);
            return () => {
                document.body.removeEventListener('mouseup', dragEnd);
                document.body.removeEventListener('mousemove', dragEnd);
            };
        }
    }, [dragging, handleDragCancel, page.config.size, handleDragEnd, r]);

    const handleMouseDown = useCallback(
        (ev: MEvent<HTMLDivElement>) => {
            if (mode === 'preview' || !draftRef.current) {
                return;
            }
            const { x, y } = transformCoord(draftRef.current, ev, page.config.size.w, page.config.size.h, r);
            setDragging({
                from: { x, y },
                to: { x, y },
            });
        },
        [mode, page.config.size, r]
    );

    const handleMouseMove = useCallback(
        (ev: MEvent<HTMLDivElement>) => {
            if (mode === 'preview') {
                return;
            }
            if (dragging && draftRef.current) {
                const { x, y } = transformCoord(draftRef.current, ev, page.config.size.w, page.config.size.h, r);
                setDragging({
                    from: dragging.from,
                    to: { x, y },
                });
            }
        },
        [mode, dragging, page.config.size, r]
    );

    const adjustCardSize = useCallback(
        (index: number, dir: 'n' | 'e' | 's' | 'w') => {
            const card = page.cards[index];
            if (!card) {
                return;
            }
            const layout = card.layout;
            const nearest = page.cards.reduce<number>(
                (limit, item, i) => {
                    if (i === index) {
                        return limit;
                    }
                    switch (dir) {
                        case 'n': {
                            if (checkOverlap({ x: layout.x, y: 0, w: layout.w, h: layout.y + layout.h }, item.layout)) {
                                return Math.max(limit, item.layout.y + item.layout.h);
                            }
                            return limit;
                        }
                        case 'e': {
                            if (checkOverlap({ x: layout.x, y: layout.y, w: Infinity, h: layout.h }, item.layout)) {
                                return Math.min(limit, item.layout.x);
                            }
                            return limit;
                        }
                        case 's': {
                            if (checkOverlap({ x: layout.x, y: layout.y, w: layout.w, h: Infinity }, item.layout)) {
                                return Math.min(limit, item.layout.y);
                            }
                            return limit;
                        }
                        case 'w': {
                            if (checkOverlap({ x: 0, y: layout.y, w: layout.x + layout.w, h: layout.h }, item.layout)) {
                                return Math.max(limit, item.layout.x + item.layout.w);
                            }
                            return limit;
                        }
                        default: {
                            return limit;
                        }
                    }
                },
                ['n', 'w'].includes(dir) ? -Infinity : Infinity
            );
            if (isFinite(nearest)) {
                switch (dir) {
                    case 'n': {
                        const next = {
                            ...layout,
                            y: nearest,
                            h: layout.h + (layout.y - nearest),
                        };
                        moveCard(index, next.x, next.y);
                        resizeCard(index, next.w, next.h);
                        break;
                    }
                    case 'e': {
                        const next = {
                            ...layout,
                            w: nearest - layout.x,
                        };
                        resizeCard(index, next.w, next.h);
                        break;
                    }
                    case 's': {
                        const next = {
                            ...layout,
                            h: nearest - layout.y,
                        };
                        resizeCard(index, next.w, next.h);
                        break;
                    }
                    case 'w': {
                        const next = {
                            ...layout,
                            x: nearest,
                            w: layout.w + (layout.x - nearest),
                        };
                        moveCard(index, next.x, next.y);
                        resizeCard(index, next.w, next.h);
                        break;
                    }
                    default: {
                        break;
                    }
                }
            } else {
                switch (dir) {
                    case 'n': {
                        const next = {
                            ...layout,
                            y: 0,
                            h: layout.h + layout.y,
                        };
                        moveCard(index, next.x, next.y);
                        resizeCard(index, next.w, next.h);
                        break;
                    }
                    case 'e': {
                        const next = {
                            ...layout,
                            w: page.config.size.w - layout.x,
                        };
                        resizeCard(index, next.w, next.h);
                        break;
                    }
                    case 's': {
                        const next = {
                            ...layout,
                            h: page.config.size.h - layout.y,
                        };
                        resizeCard(index, next.w, next.h);
                        break;
                    }
                    case 'w': {
                        const next = {
                            ...layout,
                            x: 0,
                            w: layout.w + layout.x,
                        };
                        moveCard(index, next.x, next.y);
                        resizeCard(index, next.w, next.h);
                        break;
                    }
                    default: {
                        break;
                    }
                }
            }
        },
        [page, moveCard, resizeCard]
    );

    const handleDoubleClick = useCallback(
        (ev: MEvent<HTMLDivElement>) => {
            if (mode === 'preview' || !draftRef.current) {
                return;
            }
            // 双击创建一个新的卡片，点击坐标作为左上角定位，大小延伸至最大填充位置
            const { x, y } = transformCoord(draftRef.current, ev, page.config.size.w, page.config.size.h, r);
            // 猜一个宽高比
            const [guessW, guessH] = page.cards.length
                ? page.cards.reduce<[number, number]>(
                      ([w, h], card, _, arr) => {
                          return [w + card.layout.w / arr.length, h + card.layout.h / arr.length];
                      },
                      [0, 0]
                  )
                : [page.config.size.w, page.config.size.h];
            const ratio = guessW / guessH;
            // 二分找到这个宽高比的最大填充位置
            const layout = (() => {
                let layoutL = {
                    w: MIN_CARD_SIZE,
                    h: MIN_CARD_SIZE,
                };
                if (!canDrop({ x, y, ...layoutL })) {
                    return null;
                }
                let layoutR =
                    (page.config.size.w - x) / (page.config.size.h - y) >= ratio
                        ? {
                              w: page.config.size.w - x,
                              h: Math.floor((page.config.size.w - x) / ratio),
                          }
                        : {
                              w: page.config.size.h - y,
                              h: Math.floor((page.config.size.h - y) * ratio),
                          };
                while (!canDrop({ x, y, ...layoutR })) {
                    const layoutM = {
                        w: Math.floor((layoutL.w + layoutR.w) / 2),
                        h: Math.floor((layoutL.h + layoutR.h) / 2),
                    };
                    if (layoutM.w === layoutL.w && layoutM.h === layoutL.h) {
                        return { x, y, ...layoutL };
                    }
                    if (canDrop({ x, y, ...layoutM })) {
                        layoutL = layoutM;
                    } else {
                        layoutR = layoutM;
                    }
                }
                return { x, y, ...layoutR };
            })();
            if (layout) {
                // 继续延伸直到两个方向都到最大值
                const idx = addCard(layout) - 1;
                adjustCardSize(idx, 'e');
                adjustCardSize(idx, 's');
            }
        },
        [mode, page.config.size, page.cards, canDrop, addCard, adjustCardSize, r]
    );

    useEffect(() => {
        if (focus !== null && !page.cards[focus]) {
            setFocus(null);
        }
    }, [focus, page.cards]);

    const getRefLinesCache = useRef<[number, RefLine[]]>();

    const getRefLines = useCallback(
        (selfIdx: number): RefLine[] => {
            const cache = getRefLinesCache.current;
            if (cache?.[0] === selfIdx) {
                return cache[1];
            }
            const lines: RefLine[] = [
                {
                    direction: 'x',
                    position: 0,
                    reason: ['canvas-limit'],
                    score: 1,
                },
                {
                    direction: 'y',
                    position: 0,
                    reason: ['canvas-limit'],
                    score: 1,
                },
                {
                    direction: 'x',
                    position: page.config.size.w,
                    reason: ['canvas-limit'],
                    score: 1,
                },
                {
                    direction: 'y',
                    position: page.config.size.h,
                    reason: ['canvas-limit'],
                    score: 1,
                },
            ];
            const cards = page.cards.filter((_, i) => i !== selfIdx);
            for (const card of cards) {
                lines.push(
                    {
                        direction: 'x',
                        position: card.layout.x,
                        reason: ['align-other-card'],
                        score: 1,
                    },
                    {
                        direction: 'y',
                        position: card.layout.y,
                        reason: ['align-other-card'],
                        score: 1,
                    },
                    {
                        direction: 'x',
                        position: card.layout.x + card.layout.w,
                        reason: ['align-other-card'],
                        score: 1,
                    },
                    {
                        direction: 'y',
                        position: card.layout.y + card.layout.h,
                        reason: ['align-other-card'],
                        score: 1,
                    }
                );
            }
            const res = lines
                .reduce<RefLine[]>((list, line) => {
                    const same = list.find((which) => which.direction === line.direction && which.position === line.position);
                    if (same) {
                        for (const reason of line.reason) {
                            if (!same.reason.includes(reason)) {
                                same.reason.push(reason);
                            }
                        }
                        same.score += line.score;
                    } else {
                        list.push(line);
                    }
                    return list;
                }, [])
                .sort((a, b) => b.score - a.score);
            const cacheData: [number, RefLine[]] = [selfIdx, res];
            getRefLinesCache.current = cacheData;
            setTimeout(() => {
                if (getRefLinesCache.current === cacheData) {
                    getRefLinesCache.current = undefined;
                }
            }, 1_000);
            return res;
        },
        [page]
    );

    return (
        <Container onClick={handleClick}>
            <div className="draft">
                <DashboardRenderer
                    page={page}
                    renderRatio={r}
                    ref={draftRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onDoubleClick={handleDoubleClick}
                    dataLimit={mode === 'edit' ? 2_000 : Infinity}
                    editor={
                        mode === 'edit'
                            ? (index) => ({
                                  draftRef,
                                  sampleSize: 2_000,
                                  canDrop,
                                  ratio: r,
                                  focused: focus === index,
                                  onFocus: () => setFocus(index),
                                  isSizeValid,
                                  operators: {
                                      ...operators,
                                      adjustCardSize: adjustCardSize.bind({}, index),
                                      getRefLines,
                                  },
                              })
                            : undefined
                    }
                >
                    {mode === 'edit' && dragDest && (
                        <DragBox
                            canDrop={canDrop(dragDest) && isSizeValid(dragDest.w, dragDest.h)}
                            style={{
                                left: dragDest.x * r,
                                top: dragDest.y * r,
                                width: dragDest.w * r,
                                height: dragDest.h * r,
                            }}
                        />
                    )}
                </DashboardRenderer>
            </div>
            {mode === 'edit' && (
                <DashboardPanel page={page} operators={operators} sampleSize={sampleSize} card={focus === null ? null : page.cards[focus] ?? null} />
            )}
        </Container>
    );
};

export default observer(DashboardDraft);
