import { applyFilters } from "@kanaries/loa";
import { observer } from "mobx-react-lite";
import { FC, useCallback } from "react";
import styled from "styled-components";
import ReactVega from "../../components/react-vega";
import VisErrorBoundary from "../../components/visErrorBoundary";
import type { IInsightVizView } from "../../interfaces";
import { useGlobalStore } from "../../store";
import { DashboardPanelProps } from "./dashboard-panel";


const Container = styled.div``;

const SourcePanel: FC<DashboardPanelProps> = ({ page, card }) => {
    const { filters } = page.data;

    const { collectionStore, dataSourceStore } = useGlobalStore();
    const { collectionList } = collectionStore;
    const { cleanedData } = dataSourceStore;

    const apply = useCallback((view: IInsightVizView) => {
        card.content.chart = {
            subset: view.spec,
            filters: view.filters,
            size: {
                w: 100,
                h: 100,
            },
            selectors: [],
        };
    }, [card]);

    // console.log(JSON.parse(JSON.stringify(card)));

    return (
        <Container>
            {collectionList.length === 0 && '你的收藏夹是空的'}
            {/* {collectionList.slice(pageIndex * VIEW_NUM_IN_PAGE, (pageIndex + 1) * VIEW_NUM_IN_PAGE).map(item => ( */}
            {collectionList.map(item => (
                <div
                    key={item.viewId}
                    onClick={() => apply(item)}
                >
                    <VisErrorBoundary>
                        <ReactVega
                            dataSource={applyFilters(cleanedData, [...item.filters, ...filters.map(f => f.filter)])}
                            spec={{
                                ...item.spec,
                                width: 120,
                                height: 50,
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
