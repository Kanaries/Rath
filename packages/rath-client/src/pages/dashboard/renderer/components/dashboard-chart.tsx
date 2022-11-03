import { applyFilters } from '@kanaries/loa';
import { runInAction } from 'mobx';
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


const Container = styled.div``;

interface DashboardChartProps {
    ratio: number;
    item: NonNullable<DashboardCardState['content']['chart']>;
    filters: IFilter[];
    onFilter?: (filters: Readonly<IFilter[]>) => void;
}

const DashboardChart: FC<DashboardChartProps> = ({
    item, filters, ratio, onFilter,
}) => {
    const { dataSourceStore } = useGlobalStore();
    const { cleanedData } = dataSourceStore;
    const data = useMemo(() => applyFilters(cleanedData, filters), [cleanedData, filters]);
    const { selectors } = item;

    const { xField, yField, rangeFilterApplied, xRange, yRange, xValues, yValues } = useMemo(() => {
        const xField = item.subset.encoding.x?.field;
        const yField = item.subset.encoding.y?.field;

        const anyFilterApplied = onFilter && selectors.length > 0;
        const rangeFilterApplied = anyFilterApplied && selectors.every(f => f.type === 'range');
        const setFilterApplied = anyFilterApplied && selectors.every(f => f.type === 'set');

        const xRange = (rangeFilterApplied ? (
            selectors.find(f => f.fid === xField) as IFilter & { type: 'range' } | undefined
        )?.range : undefined) ?? [-Infinity, Infinity];
        const yRange = (rangeFilterApplied ? (
            selectors.find(f => f.fid === yField) as IFilter & { type: 'range' } | undefined
        )?.range : undefined) ?? [-Infinity, Infinity];

        const xValues = (setFilterApplied ? (
            selectors.find(f => f.fid === xField) as IFilter & { type: 'set' } | undefined
        )?.values : []) ?? [];
        const yValues = (setFilterApplied ? (
            selectors.find(f => f.fid === yField) as IFilter & { type: 'set' } | undefined
        )?.values : []) ?? [];

        return { xField, yField, rangeFilterApplied, setFilterApplied, xRange, yRange, xValues, yValues };
    }, [item, selectors, onFilter]);

    const spec = useMemo(() => {
        return {
            data: item.subset.data,
            layer: [{
                params: onFilter ? [{
                    name: 'brush',
                    value: rangeFilterApplied ? {
                        x: [xRange[0], xRange[1]],
                        y: [yRange[0], yRange[1]],
                    } : undefined,
                    select: {
                        type: 'interval',
                        clear: 'mouseup',
                    },
                }, new Array<typeof item.subset.mark>(
                    'bar', 'arc', 'point', 'circle', 'rect'
                ).includes((item.subset.mark as unknown as { type: typeof item.subset.mark })?.type) && {
                    name: 'sl',
                    value: {
                        x: xValues,
                        y: yValues,
                    },
                    select: {
                        type: 'point',
                    },
                }].filter(Boolean) as ({ name: string })[] : undefined,
                mark: {
                    type: (item.subset.mark as unknown as { type: typeof item.subset.mark })?.type,
                    tooltip: true,
                },
                encoding: {
                    ...item.subset.encoding,
                    opacity: { value: onFilter ? 0.33 : 0.8 },
                },
            }, onFilter ? {
                transform: [{
                    filter: {
                        param: item.selectors[0]?.type === 'set' ? 'sl' : 'brush',
                    },
                }],
                mark: item.subset.mark,
                encoding: {
                    ...item.subset.encoding,
                    opacity: { value: 1 },
                },
            } : undefined].filter(Boolean),
        };
    }, [item, rangeFilterApplied, xRange, yRange, xValues, yValues, onFilter]);

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
                runInAction(() => {
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
    }, [item]);

    const fontSize = ratio * 3.3;

    return (
        <Container className="chart" ref={ref} onMouseDown={e => e.stopPropagation()}>
            <VisErrorBoundary>
                <ReactVega
                    dataSource={data}
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
                />
            </VisErrorBoundary>
        </Container>
    );
};

export default observer(DashboardChart);
