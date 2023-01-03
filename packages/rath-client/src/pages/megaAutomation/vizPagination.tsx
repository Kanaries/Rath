import { Icon, SearchBox, Theme, useTheme, Spinner } from '@fluentui/react';
import { IPattern } from '@kanaries/loa';
import usePagination from '@material-ui/core/usePagination/usePagination';
import produce from 'immer';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import ReactVega from '../../components/react-vega';
import { IFieldMeta, IVegaSubset } from '../../interfaces';
import { distVis } from '../../queries/distVis';
import { useGlobalStore } from '../../store';
import VisErrorBoundary from '../../components/visErrorBoundary';
import { changeVisSize } from '../collection/utils';
import { ILazySearchInfoBase, searchFilterView } from '../../utils';
import { labDistVisService } from '../../services';

const VizCard = styled.div<{ selected?: boolean; isChart: boolean }>`
    /* width: 140px; */
    ${({ isChart }) => isChart ? `
        flex-grow: 1;
        flex-shrink: 1;
        flex-basis: 140px;
    ` : ''}
    overflow: hidden;
    height: 140px;
    padding: 4px;
    margin: 0 4px;
    border: 1px solid ${(props) => (props.selected ? '#faad14' : 'transparent')};
    color: #434343;
    border-radius: 4px;
    display: flex;
    cursor: pointer;
    justify-content: center; /* 水平居中 */
    align-items: center; /* 垂直居中 */
    user-select: none;
    > * {
        pointer-events: none;
    }
`;

const VizCardContainer = styled.div<{ theme: Theme }>`
    display: flex;
    overflow: hidden;
    background-color: ${({ theme }) => theme.palette?.neutralLighterAlt};
    margin-top: 1em;
    padding: 4px 0;
    > * {
        background-color: ${({ theme }) => theme.palette?.white};
        box-shadow: 0 0 1.5px ${({ theme }) => theme.palette?.neutralQuaternary};
    }
`;

const StyledChart = styled(ReactVega)`
    cursor: pointer;
`;

function extractVizGridOnly(spec: IVegaSubset): IVegaSubset {
    const nextSpec = produce(spec, (draft) => {
        draft.view = {
            stroke: null,
            fill: null,
        };
        for (let ch in draft.encoding) {
            if (draft.encoding[ch as keyof IVegaSubset['encoding']]) {
                // @ts-ignore
                draft.encoding[ch as keyof IVegaSubset['encoding']]!.title = null;
                // @ts-ignore
                draft.encoding[ch as keyof IVegaSubset['encoding']]!.axis = {
                    labels: false,
                    ticks: false,
                };
                // for cases when you want to show axis
                // draft.encoding[ch as keyof IVegaSubset['encoding']]!.axis = {
                //     labelLimit: 32,
                //     labelOverlap: 'parity',
                //     ticks: false,
                // };
                // @ts-ignore
                draft.encoding[ch].legend = null;
                if (ch === 'size') {
                    draft.encoding[ch as keyof IVegaSubset['encoding']]!.scale = { rangeMax: 120, rangeMin: 0 };
                }
            }
        }
    });
    return nextSpec;
}

const VizPagination: React.FC = (props) => {
    const { megaAutoStore, commonStore } = useGlobalStore();
    const { insightSpaces, fieldMetas, visualConfig, vizMode, pageIndex, dataSource, samplingDataSource } = megaAutoStore;
    const [searchContent, setSearchContent] = useState<string>('');
    const updatePage = useCallback(
        (e: any, v: number) => {
            megaAutoStore.emitViewChangeTransaction((v - 1) % insightSpaces.length);
        },
        [megaAutoStore, insightSpaces.length]
    );

    const insightViews = useMemo<ILazySearchInfoBase[]>(() => {
        return insightSpaces.map((space, i) => {
            const fields = space.dimensions
                .concat(space.measures)
                .map((f) => fieldMetas.find((fm) => fm.fid === f))
                .filter((f) => Boolean(f)) as IFieldMeta[];
            const patt: IPattern = { fields, imp: space.score || 0 };
            const specFactory: ILazySearchInfoBase['specFactory'] = async () => {
                const spec =
                    vizMode === 'strict'
                        ? await labDistVisService({
                            pattern: patt,
                            width: 200,
                            height: 160,
                            dataSource: dataSource,
                        })
                        : distVis({
                            pattern: patt,
                            width: 200,
                            height: 160,
                            stepSize: 32,
                        });
                const viewSpec = extractVizGridOnly(changeVisSize(spec, 100, 100));
                return viewSpec;
            };

            return {
                id: i,
                fields,
                filters: [],
                specFactory,
            };
        });
    }, [fieldMetas, vizMode, insightSpaces, dataSource]);

    const searchedInsightViews = useMemo(() => {
        return searchFilterView(searchContent, insightViews);
    }, [searchContent, insightViews]);

    const { items } = usePagination({
        count: searchedInsightViews.length,
        showFirstButton: false,
        showLastButton: false,
        siblingCount: 1,
        page: pageIndex + 1,
        onChange: updatePage,
    });
    const theme = useTheme();

    const [resolvedSpec, setResolvedSpec] = useState<{ [id: number]: IVegaSubset }>({});

    useEffect(() => {
        setResolvedSpec({});
    }, [insightViews]);

    const insightViewsRef = useRef(insightViews);
    insightViewsRef.current = insightViews;

    const resolveChart = useMemo<(id: number, neighbors?: number[]) => void>(() => {
        const execFlags: { [id: number]: boolean } = {};

        return (id: number, neighbors = []) => {
            if (execFlags[id]) {
                for (const neighbor of neighbors) {
                    resolveChart(neighbor);
                }
                return;
            }
            execFlags[id] = true;
            const item = insightViewsRef.current.find(v => v.id === id);
            if (!item) {
                return;
            }
            item.specFactory().then(spec => {
                setResolvedSpec(all => produce(all, draft => {
                    draft[id] = spec;
                }));
                for (const neighbor of neighbors) {
                    resolveChart(neighbor);
                }
            });
        };
    }, []);

    const chartsInView = useMemo(() => {
        if (searchedInsightViews.length === 0) {
            return [];
        }
        return items.filter(
            ({ type, page }) => type === 'page' && typeof page === 'number' && searchedInsightViews[page - 1]
        ).map<{ id: number; neighbors: number[] }>(({ page }) => {
            const view = searchedInsightViews[page - 1];
            const neighbors = [-2, -1, 1, 2].map(offset => searchedInsightViews[page - 1 + offset]).filter(Boolean).map(v => v.id);
            return {
                id: view.id,
                neighbors,
            };
        });
    }, [items, searchedInsightViews]);

    useEffect(() => {
        for (const chart of chartsInView) {
            resolveChart(chart.id, chart.neighbors);
        }
    }, [chartsInView, resolveChart]);

    return (
        <div>
            <SearchBox onSearch={setSearchContent} placeholder={intl.get('common.search.searchViews')} iconProps={{ iconName: 'Search' }} />
            <VizCardContainer theme={theme}>
                {searchedInsightViews.length > 0 &&
                    items.map(({ page, type, selected, ...item }, index) => {
                        let children = null;
                        let isChart = false;
                        if (type === 'start-ellipsis' || type === 'end-ellipsis') {
                            children = '…';
                        } else if (type === 'page') {
                            if (typeof page === 'number' && searchedInsightViews[page - 1]) {
                                const view = searchedInsightViews[page - 1];
                                isChart = true;
                                const spec = resolvedSpec[view.id];
                                if (!spec) {
                                    children = (
                                        <div style={{ width: '102px' }}>
                                            <Spinner />
                                        </div>
                                    );
                                } else {
                                    children = (
                                        <VisErrorBoundary>
                                            <StyledChart
                                                dataSource={samplingDataSource}
                                                spec={spec}
                                                actions={visualConfig.debug}
                                                config={commonStore.themeConfig}
                                            />
                                        </VisErrorBoundary>
                                    );
                                }
                            } else {
                                children = (
                                    <button
                                        type="button"
                                        style={{
                                            fontWeight: selected ? 'bold' : undefined,
                                        }}
                                        {...item}
                                    >
                                        {page}
                                    </button>
                                );
                            }
                        } else {
                            if (type === 'next') children = <Icon style={{ fontSize: '2em', fontWeight: 600 }} iconName="ChevronRight" />;
                            if (type === 'previous') children = <Icon style={{ fontSize: '2em', fontWeight: 600 }} iconName="ChevronLeft" />;
                        }
                        return (
                            <VizCard isChart={isChart} {...item} selected={selected} key={index}>
                                {children}
                            </VizCard>
                        );
                    })}
            </VizCardContainer>
        </div>
    );
};

export default observer(VizPagination);
