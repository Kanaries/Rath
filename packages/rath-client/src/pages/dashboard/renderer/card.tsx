import { observer } from 'mobx-react-lite';
import { CSSProperties, FC, useMemo } from 'react';
import styled from 'styled-components';
import { DashboardCardAppearance, DashboardCardInsetLayout, DashboardCardState, DashboardDocumentOperators } from '../../../store/dashboardStore';
import type { IFilter } from '../../../interfaces';
import CardDisplay from './card-display';
import CardEditor from './card-editor';
import DashboardChart from './components/dashboard-chart';
import { MIN_CARD_SIZE } from './constant';

export interface CardProps {
    ratio: number;
    sampleSize: number;
    globalFilters: IFilter[];
    cards: Readonly<DashboardCardState[]>;
    card: DashboardCardState;
    index: number;
    /** @default undefined */
    editor?: Omit<CardProviderProps, 'children' | 'transformCoord' | 'item' | 'index'> | undefined;
    transformCoord: (ev: { clientX: number; clientY: number }) => { x: number; y: number };
}

export interface CardProvider {
    content: JSX.Element | null;
    canvasContent?: JSX.Element | null | undefined;
    onRootMouseDown: (x: number, y: number) => void;
    onDoubleClick: () => void;
    onClick: () => void;
    onFilter: (filters: Readonly<IFilter[]>) => void;
    style: CSSProperties;
}

export const layoutOption = {
    title: {
        flex: 0,
    },
    text: {
        flex: 1,
        prefer: 15,
    },
    chart: {
        flex: 9,
        prefer: 75,
    },
} as const;

export type RefLine = {
    direction: 'x' | 'y';
    position: number;
    reason: (
        | 'canvas-limit'
        | 'align-other-card'
        | 'other-card-size' // TODO: [feat] 还没有实现，other-card-size 而且需要额外考虑当前卡片位置
        | 'card-padding' // TODO: [feat] 还没有实现 card-padding
        | 'canvas-padding'
    )[]; // TODO: [feat] 还没有实现 canvas-padding
    //  kyusho, 5 days ago   (November 24th, 2022 5:31 PM)
    score: number;
};

export interface CardProviderProps {
    children: (provider: Partial<CardProvider>) => JSX.Element;
    transformCoord: (ev: { clientX: number; clientY: number }) => { x: number; y: number };
    draftRef: { current: HTMLElement | null };
    index: number;
    item: Readonly<DashboardCardState>;
    onFocus?: () => void;
    focused?: boolean;
    canDrop: (layout: DashboardCardState['layout'], except?: number) => boolean;
    isSizeValid: (w: number, h: number) => boolean;
    operators: Partial<
        DashboardDocumentOperators & {
            adjustCardSize: (dir: 'n' | 'e' | 's' | 'w') => void;
            getRefLines: (selfIdx: number) => RefLine[];
        }
    >;
    ratio: number;
}

const CardBox = styled.div<{ direction: 'column' | 'row'; appearance: DashboardCardAppearance }>`
    box-sizing: border-box;
    user-select: none;
    position: absolute;
    background-color: #fff;
    border: calc(1px * var(--ratio)) solid transparent;
    padding: calc(var(--padding) * var(--ratio));
    ${({ appearance }) =>
        ((
            {
                transparent: `
            border-color: transparent;
        `,
                outline: `
            border-color: #888;
        `,
                dropping: `
            border: none;
            padding: calc(var(--padding) + 1px * var(--ratio));
            box-shadow:
                0 1.6px 3.6px 0 rgb(0 0 0 / 13%), 0 0.3px 0.9px 0 rgb(0 0 0 / 11%),
                inset 0 6.4px 14.4px 0 rgb(0 0 0 / 6%), inset 0 1.2px 3.6px 0 rgb(0 0 0 / 4%);
        `,
                neumorphism: `
            border: none;
            padding: calc(var(--padding) + 1px * var(--ratio));
            border-radius: var(--padding);
            background-image: linear-gradient(145deg, #00000008, #00000004, #00000002);
            box-shadow:  6px 6px 12px #bebebe,
                -6px -6px 12px #ffffff;
        `,
            } as const
        )[appearance])}
    cursor: default;
    display: flex;
    flex-direction: ${({ direction }) => direction};
    align-items: stretch;
    justify-content: center;
    & .title,
    & .text {
        padding: calc(var(--padding) * 0.4) calc(var(--padding) * 0.8);
        ${({ direction }) => (direction === 'column' ? '' : 'writing-mode: vertical-rl;')}
        writing-mode: ${({ direction }) => (direction === 'column' ? 'horizontal-tb' : 'sideways-lr')}; // sideways-lr is not supported yet
        text-orientation: mixed;
        overflow: hidden;
    }
    & .title {
        font-size: calc(16px * var(--ratio));
        flex-grow: ${layoutOption.title.flex};
        flex-basis: max-content;
    }
    & .text {
        font-size: calc(13px * var(--ratio));
        flex-grow: ${layoutOption.text.flex};
        flex-basis: ${layoutOption.text.prefer}%;
    }
    & .chart {
        flex-grow: ${layoutOption.chart.flex};
        flex-basis: ${layoutOption.chart.prefer}%;
        overflow: hidden;
        :not(:first-child) {
            ${({ direction }) => (direction === 'column' ? 'margin-top' : 'margin-left')}: 5%;
        }
    }
`;

const Card: FC<CardProps> = ({ globalFilters, cards, card, editor, transformCoord, index, ratio, sampleSize }) => {
    const Provider = useMemo(() => {
        return editor ? CardEditor : CardDisplay;
    }, [editor]);

    // 在编辑模式 (Boolean(editor) === true) 下，卡片可作为筛选器，需要展现不经过自己筛选规则的全部数据，
    // 而在预览模式下，卡片只呈现经过所有筛选规则的数据。
    const selectors = cards.map((c, i) => (editor && i === index ? [] : c.content.chart?.selectors ?? [])).flat();
    // 在编辑模式 (Boolean(editor) === true) 下，屏蔽 highlight 功能
    const highlighters = editor ? undefined : cards.map((c) => c.content.chart?.highlighter ?? []).flat();

    const filters = useMemo<IFilter[]>(() => {
        return card.content.chart ? [...card.content.chart.filters, ...globalFilters, ...selectors] : [];
    }, [card.content.chart, globalFilters, selectors]);

    const containerDirection = card.layout.w / card.layout.h >= 1 ? 'horizontal' : 'portrait';

    const flexDirection = useMemo<'row' | 'column'>(() => {
        switch (card.config.align) {
            case DashboardCardInsetLayout.Auto: {
                return containerDirection === 'horizontal' ? 'row' : 'column';
            }
            case DashboardCardInsetLayout.Column: {
                return 'column';
            }
            case DashboardCardInsetLayout.Row: {
                return 'row';
            }
            default: {
                return 'row';
            }
        }
    }, [card.config.align, containerDirection]);

    return (
        <Provider
            {...(editor ?? {
                draftRef: { current: null },
                canDrop: () => false,
                isSizeValid: () => false,
                operators: {},
            })}
            transformCoord={transformCoord}
            item={card}
            index={index}
            ratio={ratio}
        >
            {(provider) => (
                <>
                    <CardBox
                        onMouseDown={(e) => {
                            e.stopPropagation();
                            const pos = transformCoord(e);
                            provider.onRootMouseDown?.(pos.x, pos.y);
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            provider.onClick?.();
                        }}
                        onDoubleClick={provider.onDoubleClick}
                        direction={flexDirection}
                        appearance={card.config.appearance}
                        style={{
                            left: card.layout.x * ratio,
                            top: card.layout.y * ratio,
                            width: card.layout.w * ratio,
                            height: card.layout.h * ratio,
                            // @ts-ignore
                            '--padding': `${MIN_CARD_SIZE * 0.1 * ratio}px`,
                            ...provider.style,
                        }}
                    >
                        {card.content.title && <header className="title">{card.content.title}</header>}
                        {card.content.text && <pre className="text">{card.content.text}</pre>}
                        {card.content.chart && (
                            <DashboardChart
                                item={card.content.chart}
                                sampleSize={sampleSize}
                                filters={filters}
                                highlighters={highlighters}
                                ratio={ratio}
                                onFilter={provider.onFilter}
                            />
                        )}
                        {provider.content}
                    </CardBox>
                    {provider.canvasContent}
                </>
            )}
        </Provider>
    );
};

export default observer(Card);
