import { applyFilters } from '@kanaries/loa';
import { observer } from 'mobx-react-lite';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { deepcopy } from 'visual-insights/build/esm/utils';
import ReactVega from '../../components/react-vega';
import VisErrorBoundary from '../../components/visErrorBoundary';
import type { IInsightVizView } from '../../interfaces';
import { useGlobalStore } from '../../store';
import { viewSampling } from '../../lib/stat/sampling';
import { DashboardPanelProps } from './dashboard-panel';

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

const SourcePanel: FC<DashboardPanelProps> = ({ page, card, sampleSize }) => {
    const { filters } = page.data;

    const { collectionStore, dataSourceStore, dashboardStore, commonStore } = useGlobalStore();
    const { collectionList } = collectionStore;
    const { cleanedData } = dataSourceStore;

    const size = Math.min(cleanedData.length, sampleSize);
    const fullSet = useMemo(() => {
        return viewSampling(cleanedData, [], size);
    }, [cleanedData, size]);

    const apply = useCallback(
        (view: IInsightVizView) => {
            if (card) {
                dashboardStore.runInAction(() => {
                    const data = deepcopy(view) as typeof view;
                    card.content.chart = {
                        subset: data.spec,
                        filters: data.filters,
                        size: {
                            w: 1,
                            h: 1,
                        },
                        selectors: [],
                        highlighter: [],
                    };
                    card.content.title = data.title || card.content.title;
                    card.content.text = data.desc || card.content.text;
                });
            }
        },
        [card, dashboardStore]
    );

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
            {collectionList.length === 0 && 'collection is empty'}
            {collectionList.map((item) => (
                <div key={item.viewId} onClick={() => apply(item)} className="item">
                    <VisErrorBoundary>
                        <ReactVega
                            dataSource={applyFilters(fullSet, [...item.filters, ...filters.map((f) => f.filter)])}
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
                            config={commonStore.themeConfig}
                        />
                    </VisErrorBoundary>
                </div>
            ))}
        </Container>
    );
};

export default observer(SourcePanel);
