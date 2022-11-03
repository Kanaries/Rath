import { applyFilters } from "@kanaries/loa";
import { runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import { FC, useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import ReactVega from "../../components/react-vega";
import VisErrorBoundary from "../../components/visErrorBoundary";
import type { IInsightVizView } from "../../interfaces";
import { useGlobalStore } from "../../store";
import { DashboardPanelProps } from "./dashboard-panel";


const Container = styled.div`
    & .item {
        margin-block: 1em;
        cursor: pointer;
        :hover {
            background-color: #8881;
        }
        & * {
            pointer-events: none;
        }
    }
`;

const SourcePanel: FC<DashboardPanelProps> = ({ page, card }) => {
    const { filters } = page.data;

    const { collectionStore, dataSourceStore } = useGlobalStore();
    const { collectionList } = collectionStore;
    const { cleanedData } = dataSourceStore;

    const apply = useCallback((view: IInsightVizView) => {
        if (card) {
            runInAction(() => {
                card.content.chart = {
                    subset: view.spec,
                    filters: view.filters,
                    size: {
                        w: 100,
                        h: 100,
                    },
                    selectors: [],
                };
            });
        }
    }, [card]);

    // console.log(JSON.parse(JSON.stringify(card)));
    const [width, setWidth] = useState(0);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const { current: container } = ref;
        if (container) {
            const cb = () => {
                const { width: w } = container.getBoundingClientRect();
                if (w !== width) {
                    setWidth(w);
                }
            };
            const ro = new ResizeObserver(cb);
            ro.observe(container);
            return () => ro.disconnect();
        }
    }, [width]);

    return (
        <Container ref={ref}>
            {collectionList.length === 0 && '你的收藏夹是空的'}
            {collectionList.map(item => (
                <div
                    key={item.viewId}
                    onClick={() => apply(item)}
                    className="item"
                >
                    <VisErrorBoundary>
                        <ReactVega
                            dataSource={applyFilters(cleanedData, [...item.filters, ...filters.map(f => f.filter)])}
                            spec={{
                                ...item.spec,
                                width,
                                height: width / 1.6,
                                autosize: {
                                    type: 'fit',
                                    contains: 'padding',
                                },
                                background: '#0000',
                            }}
                            actions={false}
                        />
                    </VisErrorBoundary>
                </div>
            ))}
        </Container>
    );
};


export default observer(SourcePanel);
