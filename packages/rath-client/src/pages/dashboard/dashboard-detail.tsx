import { ActionButton } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import { FC, MouseEvent as MEvent, useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useGlobalStore } from '../../store';
import { DashboardCard } from '../../store/dashboardStore';
import Card, { scaleRatio } from './renderer/card';


const PageLayout = styled.div`
    flex-grow: 1;
    flex-shrink: 1;
    height: calc(100vh - 16px - 1em);
    display: flex;
    flex-direction: column;
    overflow: hidden;
`;

const Header = styled.div`
    flex-grow: 0;
    flex-shrink: 0;
    background-color: #fff;
    border-radius: 2px;
    box-shadow: 0 1.6px 3.6px 0 rgb(0 0 0 / 13%), 0 0.3px 0.9px 0 rgb(0 0 0 / 11%);
    margin-bottom: 0.6em;
    margin-inline: 16px;
`;

const Container = styled.div`
    flex-grow: 1;
    flex-shrink: 1;
    overflow: auto;
`;

const Draft = styled.div<{ edit: boolean }>`
    background-color: #fff;
    border-radius: 2px;
    margin: 16px;
    box-shadow:
        0 1.6px 3.6px 0 rgb(0 0 0 / 13%), 0 0.3px 0.9px 0 rgb(0 0 0 / 11%),
        0 -1.6px 3.6px 0 rgb(0 0 0 / 13%), 0 -0.3px 0.9px 0 rgb(0 0 0 / 11%);
    ${({ edit }) => edit ? `
    background-image:
        linear-gradient(to right, #8884 0.5px, transparent 0.5px),
        linear-gradient(to left, #8884 0.5px, transparent 0.5px),
        linear-gradient(to top, #8884 0.5px, transparent 0.5px),
        linear-gradient(to bottom, #8884 0.5px, transparent 0.5px);
    ` : ''}
    background-repeat: repeat;
    background-position: 0 0;
    position: relative;
    cursor: ${({ edit }) => edit ? 'crosshair' : 'default'};
`;

const DragBox = styled.div`
    position: absolute;
    border: 1px solid #888a;
`;

export interface DashboardDetailProps {
    cursor: number;
    /** back to dashboard list */
    goBack: () => void;
}

const transformCoord = (target: HTMLElement, ev: { clientX: number; clientY: number }, w: number, h: number) => {
    const { x, y } = target.getBoundingClientRect();

    return {
        x: Math.max(0, Math.min(Math.round((ev.clientX - x) / scaleRatio), w)),
        y: Math.max(0, Math.min(Math.round((ev.clientY - y) / scaleRatio), h)),
    };
};

const checkOverlap = (a: DashboardCard['layout'], b: DashboardCard['layout']): boolean => {
    const x1 = a.x;
    const x2 = a.x + a.w;
    const y1 = a.y;
    const y2 = a.y + a.h;
    for (const [x, y] of [[x1, y1], [x1, y2], [x2, y1], [x2, y2]]) {
        if (b.x < x && b.x + b.w > x && b.y < y && b.y + b.h > y) {
            return true;
        }
    }
    return false;
};

const MIN_CARD_SIZE = 64;

const DashboardDetail: FC<DashboardDetailProps> = ({ cursor, goBack }) => {
    const { dashboardStore } = useGlobalStore();
    const page = dashboardStore.pages[cursor];
    const { operators: { addCard } } = dashboardStore.fromPage(cursor);

    const [mode, setMode] = useState<'edit' | 'preview'>('preview');

    const toggleMode = useCallback(() => {
        setMode(mode === 'edit' ? 'preview' : 'edit');
    }, [mode]);

    const draftRef = useRef<HTMLDivElement>(null);

    const [dragging, setDragging] = useState<null | { from: { x: number; y: number }; to: { x: number; y: number } }>(null);

    const handleDragEnd = useCallback((pos: { x: number; y: number }) => {
        if (!dragging) {
            return;
        }
        setDragging(null);
        const w = Math.abs(dragging.from.x - pos.x);
        const h = Math.abs(dragging.from.y - pos.y);
        if (w >= MIN_CARD_SIZE && h >= MIN_CARD_SIZE) {
            const layout = {
                x: Math.min(dragging.from.x, pos.x),
                y: Math.min(dragging.from.y, pos.y),
                w,
                h,
            };
            // 判断重叠
            for (const card of page.cards) {
                if (checkOverlap(card.layout, layout)) {
                    return;
                }
            }
            addCard(layout);
        }
    }, [dragging, addCard, page.cards]);

    const handleDragCancel = useCallback(() => {
        setDragging(null);
    }, [dragging]);

    useEffect(() => {
        if (dragging) {
            const dragEnd = (ev: MouseEvent) => {
                if (ev.type === 'mouseup' && draftRef.current) {
                    const { x, y } = transformCoord(draftRef.current, ev, page.config.size.w, page.config.size.h);
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
    }, [dragging, handleDragCancel, page.config.size]);

    const handleMouseDown = useCallback((ev: MEvent<HTMLDivElement>) => {
        if (mode === 'preview' || !draftRef.current) {
            return;
        }
        const { x, y } = transformCoord(draftRef.current, ev, page.config.size.w, page.config.size.h);
        setDragging({
            from: { x, y },
            to: { x, y },
        });
    }, [mode, handleDragEnd, page.config.size]);

    const handleMouseMove = useCallback((ev: MEvent<HTMLDivElement>) => {
        if (mode === 'preview') {
            return;
        }
        if (dragging && draftRef.current) {
            const { x, y } = transformCoord(draftRef.current, ev, page.config.size.w, page.config.size.h);
            setDragging({
                from: dragging.from,
                to: { x, y },
            });
        }
    }, [mode, dragging, page.config.size]);

    return (
        <PageLayout>
            <Header>
                <ActionButton iconProps={{ iconName: 'Back' }} onClick={goBack} />
                <ActionButton iconProps={{ iconName: mode === 'edit' ? 'AnalyticsView' : 'Edit' }} onClick={toggleMode} />
            </Header>
            <Container>
                <Draft
                    ref={draftRef}
                    edit={mode === 'edit'}
                    style={{
                        width: `${page.config.size.w * scaleRatio}px`,
                        height: `${page.config.size.h * scaleRatio}px`,
                        backgroundSize: new Array<0>(4).fill(0).map(() => `${scaleRatio}px ${scaleRatio}px`).join(','),
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                >
                    {page.cards.map((card, i) => (
                        <Card
                            key={i}
                            card={card}
                            readOnly={mode === 'preview'}
                        />
                    ))}
                    {dragging && (
                        <DragBox
                            style={{
                                left: Math.min(dragging.from.x, dragging.to.x) * scaleRatio,
                                top: Math.min(dragging.from.y, dragging.to.y) * scaleRatio,
                                width: Math.abs(dragging.from.x - dragging.to.x) * scaleRatio,
                                height: Math.abs(dragging.from.y - dragging.to.y) * scaleRatio,
                            }}
                        />
                    )}
                </Draft>
            </Container>
        </PageLayout>
    );
};

export default observer(DashboardDetail);
