import { applyFilters } from '@kanaries/loa';
import { observer } from 'mobx-react-lite';
import { FC, useEffect, useMemo, useRef } from 'react';
import styled from 'styled-components';
import type { View } from 'vega';

import ReactVega from '../../../../components/react-vega';
import VisErrorBoundary from '../../../../components/visErrorBoundary';
import type { IFilter } from '../../../../interfaces';
import { useGlobalStore } from '../../../../store';
import type { DashboardCardState } from '../../../../store/dashboardStore';
import { getRange } from '../../../../utils';
import { viewSampling } from '../../../../lib/stat/sampling';


const Container = styled.div``;

interface DashboardChartProps {
    ratio: number;
    item: NonNullable<DashboardCardState['content']['chart']>;
    sampleSize: number;
    filters: IFilter[];
    highlighters?: IFilter[];
    onFilter?: (filters: Readonly<IFilter[]>) => void;
}

const symbolRowIndex: unique symbol = Symbol('rowIndex');
const highlightSelectorPredicateName = '__dashboard_chart_item_highlighted';

const DashboardChart: FC<DashboardChartProps> = ({
    item, filters, highlighters, ratio, onFilter, sampleSize,
}) => {
    const { dataSourceStore, dashboardStore, commonStore } = useGlobalStore();
    const { cleanedData, fieldMetas } = dataSourceStore;
    const fields = useMemo(() => {
        return Object.values(item.subset.encoding).filter(Boolean).reduce<typeof fieldMetas>((list, encoding) => {
            const f = fieldMetas.find(which => which.fid === encoding.field);
            if (f) {
                list.push(f);
            }
            return list;
        }, []);
    }, [fieldMetas, item.subset.encoding]);
    const size = Math.min(cleanedData.length, sampleSize);
    const fullSet = useMemo(() => {
        return size >= cleanedData.length ? cleanedData : viewSampling(cleanedData, fields, size);
    }, [cleanedData, fields, size]);
    const data = useMemo(() => applyFilters(fullSet, filters), [fullSet, filters]);
    const highlightedData = useMemo(() => {
        const indices = applyFilters(
            data.map((row, i) => ({ ...row, [symbolRowIndex]: i })), highlighters
        ).map(row => (row as { [symbolRowIndex]: number })[symbolRowIndex]);
        const highlighted = new Map<number, 1>();
        for (const i of indices) {
            highlighted.set(i, 1);
        }
        return data.map((row, i) => ({ ...row, [highlightSelectorPredicateName]: highlighted.has(i) ? 1 : 0 }));
    }, [data, highlighters]);
    const { selectors } = item;

    const { xField, yField, rangeFilterApplied, xRange, yRange, xValues, yValues } = useMemo(() => {
        const xField = item.subset.encoding.x?.field;
        const yField = item.subset.encoding.y?.field;

        const allFilters = highlighters ? item.highlighter : selectors;

        const anyFilterApplied = onFilter && allFilters.length > 0;
        const rangeFilterApplied = anyFilterApplied && allFilters.every(f => f.type === 'range');
        const setFilterApplied = anyFilterApplied && allFilters.every(f => f.type === 'set');

        const xRange = (rangeFilterApplied ? (
            allFilters.find(f => f.fid === xField) as IFilter & { type: 'range' } | undefined
        )?.range : undefined) ?? [-Infinity, Infinity];
        const yRange = (rangeFilterApplied ? (
            allFilters.find(f => f.fid === yField) as IFilter & { type: 'range' } | undefined
        )?.range : undefined) ?? [-Infinity, Infinity];

        const xValues = (setFilterApplied ? (
            allFilters.find(f => f.fid === xField) as IFilter & { type: 'set' } | undefined
        )?.values : []) ?? [];
        const yValues = (setFilterApplied ? (
            allFilters.find(f => f.fid === yField) as IFilter & { type: 'set' } | undefined
        )?.values : []) ?? [];

        return { xField, yField, rangeFilterApplied, setFilterApplied, xRange, yRange, xValues, yValues };
    }, [item.subset.encoding.x?.field, item.subset.encoding.y?.field, item.highlighter, highlighters, selectors, onFilter]);

    const spec = useMemo(() => {
        return {
            data: {
                name: 'dataSource',
            },
            layer: [{
                params: onFilter && new Array<typeof item.subset.mark>(
                    'bar', 'arc', 'point', 'circle', 'rect'
                ).includes((item.subset.mark as unknown as { type: typeof item.subset.mark })?.type) ? [{
                    name: 'brush',
                    value: rangeFilterApplied ? {
                        x: [xRange[0], xRange[1]],
                        y: [yRange[0], yRange[1]],
                    } : undefined,
                    select: {
                        type: 'interval',
                        clear: 'mouseup',
                    },
                }, {
                    name: 'sl',
                    value: {
                        x: xValues,
                        y: yValues,
                    },
                    select: {
                        type: 'point',
                    },
                }] : undefined,
                mark: {
                    type: (item.subset.mark as unknown as { type: typeof item.subset.mark })?.type,
                    tooltip: true,
                },
                encoding: {
                    ...item.subset.encoding,
                    opacity: { value: onFilter && (
                        // highlighters 优先级高，不传 highlighters 时才走 selectors 逻辑
                        highlighters ? (item.highlighter.length || highlighters.length) : item.selectors.length
                    ) ? 0.33 : 0.8 },
                },
            }, highlighters?.length ? {
                transform: [{
                    filter: {
                        field: highlightSelectorPredicateName,
                        equal: 1,
                    },
                }],
                mark: item.subset.mark,
                encoding: {
                    ...item.subset.encoding,
                    opacity: { value: 1 },
                },
            } : onFilter && !highlighters && item.selectors[0] ? {
                transform: [{
                    filter: {
                        param: item.selectors[0].type === 'set' ? 'sl' : 'brush',
                    },
                }],
                mark: item.subset.mark,
                encoding: {
                    ...item.subset.encoding,
                    opacity: { value: 1 },
                },
            } : undefined].filter(Boolean),
        };
    }, [item, highlighters, rangeFilterApplied, xRange, yRange, xValues, yValues, onFilter]);

    const brushDataRef = useRef<{ [fid: string]: [number, number] }>({});

    const signalListeners = useMemo<{
        [key: string]: (name: any, value: any, view: View) => void;
    }>(() => {
        if (!onFilter) {
            return {};
        }

        // @see https://github.com/vega/react-vega-lite/issues/7#issuecomment-406105598
        const behaviors = spec.layer[0]?.params?.map(p => p.name) ?? [];

        if (behaviors.length === 0) {
            return {};
        }

        const listeners: { [key: string]: (name: any, value: any, view: View) => void } = {};

        for (const bhv of behaviors) {
            switch (bhv) {
                case 'brush': {
                    listeners['brush'] = (name: 'brush', data: { [fid: string]: [number, number] }) => {
                        if (Object.keys(data).length === 0) {
                            // 交互结束
                            onFilter(Object.keys(brushDataRef.current).map(key => ({
                                type: 'range',
                                fid: key,
                                range: getRange(brushDataRef.current[key]),
                            })));
                        }
                        brushDataRef.current = data;
                    };
                    break;
                }
                case 'sl': {
                    // @see https://github.com/vega/vega-lite/issues/2790
                    listeners['sl'] = (name: 'sl', data: { vlPoint: any; [field: string]: any[] }, view: View) => {
                        const filters = Object.keys(data).filter(key => [xField, yField].includes(key)).map<IFilter>(key => ({
                            type: 'set',
                            fid: key,
                            values: data[key],
                        }));
                        onFilter(filters);
                    };
                    break;
                }
                default: {
                    console.warn(`Param name "${bhv}" is not supported.`)
                }
            }
        }

        return listeners;
    }, [spec, xField, yField, onFilter]);

    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const { current: container } = ref;
        if (container) {
            const cb = () => {
                const { width, height } = container.getBoundingClientRect();
                dashboardStore.runInAction(() => {
                    item.size = {
                        w: width,
                        h: height,
                    };
                });
            };
            const ro = new ResizeObserver(cb);
            ro.observe(container);
            return () => ro.disconnect();
        }
    }, [item, dashboardStore]);

    const fontSize = ratio * 3.3;

    return (
        <Container className="chart" ref={ref} onMouseDown={e => e.stopPropagation()}>
            <VisErrorBoundary>
                <ReactVega
                    dataSource={highlightedData}
                    spec={{
                        ...spec,
                        width: item.size.w,
                        height: item.size.h,
                        autosize: {
                            type: 'fit',
                            contains: 'padding',
                        },
                        background: '#0000',
                        config: {
                            axis: {
                                titleFontSize: fontSize * 0.9,
                                labelFontSize: fontSize * 0.75,
                            },
                            mark: {
                                fontSize: fontSize,
                            },
                            legend: {
                                titleFontSize: fontSize * 0.85,
                                labelFontSize: fontSize * 0.7,
                            },
                        }
                    }}
                    actions={false}
                    signalHandler={signalListeners}
                    config={commonStore.themeConfig}
                />
            </VisErrorBoundary>
        </Container>
    );
};

export default observer(DashboardChart);
