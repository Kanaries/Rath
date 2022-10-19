import { Icon } from '@fluentui/react';
import { IPattern } from '@kanaries/loa';
import usePagination from '@material-ui/core/usePagination/usePagination';
import produce from 'immer';
import { observer } from 'mobx-react-lite';
import React, { useCallback } from 'react';
import styled from 'styled-components';
import ReactVega from '../../components/react-vega';
import { IVegaSubset } from '../../interfaces';
import { distVis } from '../../queries/distVis';
import { labDistVis } from '../../queries/labdistVis';
import { useGlobalStore } from '../../store';
import VisErrorBoundary from '../../visBuilder/visErrorBoundary';
import { changeVisSize } from '../collection/utils';

const VizCard = styled.div<{ selected?: boolean }>`
    /* width: 140px; */
    height: 140px;
    padding: 4px;
    margin: 4px;
    border: 1px solid ${(props) => (props.selected ? '#faad14' : 'rgba(0, 0, 0, 0.23)')};
    color: #434343;
    border-radius: 4px;
    display: flex;
    cursor: pointer;
    justify-content: center; /* 水平居中 */
    align-items: center; /* 垂直居中 */
`;

const VizCardContainer = styled.div`
    display: flex;
    overflow-x: auto;
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
                    labelLimit: 32,
                    labelOverlap: 'parity',
                    ticks: false,
                };
                // @ts-ignore
                draft.encoding[ch].legend = null;
            }
        }
    });
    return nextSpec;
}

const VizPagination: React.FC = (props) => {
    const { megaAutoStore } = useGlobalStore();
    const { insightSpaces, fieldMetas, visualConfig, vizMode, pageIndex, samplingDataSource } = megaAutoStore;
    const updatePage = useCallback(
        (e: any, v: number) => {
            megaAutoStore.emitViewChangeTransaction((v - 1) % insightSpaces.length);
        },
        [megaAutoStore, insightSpaces.length]
    );
    const { items } = usePagination({
        count: insightSpaces.length,
        showFirstButton: false,
        showLastButton: false,
        siblingCount: 1,
        page: pageIndex + 1,
        onChange: updatePage,
    });
    return (
        <VizCardContainer>
            {insightSpaces.length > 0 &&
                items.map(({ page, type, selected, ...item }, index) => {
                    let children = null;
                    if (type === 'start-ellipsis' || type === 'end-ellipsis') {
                        children = '…';
                    } else if (type === 'page') {
                        if (typeof page === 'number' && insightSpaces[page - 1]) {
                            const view = insightSpaces[page - 1];
                            const fields = fieldMetas.filter(
                                (m) => view.dimensions.includes(m.fid) || view.measures.includes(m.fid)
                            );
                            const patt: IPattern = { fields, imp: view.score || 0 };
                            const spec =
                                vizMode === 'strict'
                                    ? labDistVis({
                                          resizeMode: visualConfig.resize,
                                          pattern: patt,
                                          width: 200,
                                          height: 160,
                                          interactive: visualConfig.zoom,
                                          dataSource: samplingDataSource,
                                      })
                                    : distVis({
                                          resizeMode: visualConfig.resize,
                                          pattern: { fields, imp: view.score || 0 },
                                          width: 200,
                                          height: 160,
                                          interactive: visualConfig.zoom,
                                          stepSize: 32,
                                      });
                            const viewSpec = extractVizGridOnly(changeVisSize(spec, 100, 100));
                            children = (
                                // <button
                                //     type="button"
                                //     style={{
                                //         fontWeight: selected ? 'bold' : undefined,
                                //     }}
                                //     {...item}
                                // >
                                //     {page}
                                // </button>
                                <VisErrorBoundary>
                                    <StyledChart
                                        dataSource={samplingDataSource}
                                        spec={viewSpec}
                                        actions={visualConfig.debug}
                                    />
                                </VisErrorBoundary>
                            );
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
                        if (type === 'next')
                            children = <Icon style={{ fontSize: '2em', fontWeight: 600 }} iconName="ChevronRight" />;
                        if (type === 'previous')
                            children = <Icon style={{ fontSize: '2em', fontWeight: 600 }} iconName="ChevronLeft" />;
                    }
                    return (
                        <VizCard {...item} selected={selected} key={index}>
                            {children}
                        </VizCard>
                    );
                })}
        </VizCardContainer>
    );
};

export default observer(VizPagination);
