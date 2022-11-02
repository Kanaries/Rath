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


const Container = styled.div``;

interface DashboardChartProps {
    item: NonNullable<DashboardCardState['content']['chart']>;
    filters: IFilter[];
}

const DashboardChart: FC<DashboardChartProps> = ({
    item, filters,
}) => {
    const { dataSourceStore } = useGlobalStore();
    const { cleanedData } = dataSourceStore;
    const data = useMemo(() => applyFilters(cleanedData, filters), [cleanedData, filters]);

    const { xField, yField, rangeFilterApplied, xRange, yRange, xValues, yValues } = useMemo(() => {
        const xField = item.subset.encoding.x?.field;
        const yField = item.subset.encoding.y?.field;

        const anyFilterApplied = item.selectors.length > 0;
        const rangeFilterApplied = anyFilterApplied && item.selectors.every(f => f.type === 'range');
        const setFilterApplied = anyFilterApplied && item.selectors.every(f => f.type === 'set');

        const xRange = (rangeFilterApplied ? (
            item.selectors.find(f => f.fid === xField) as IFilter & { type: 'range' } | undefined
        )?.range : undefined) ?? [-Infinity, Infinity];
        const yRange = (rangeFilterApplied ? (
            item.selectors.find(f => f.fid === yField) as IFilter & { type: 'range' } | undefined
        )?.range : undefined) ?? [-Infinity, Infinity];

        const xValues = (setFilterApplied ? (
            item.selectors.find(f => f.fid === xField) as IFilter & { type: 'set' } | undefined
        )?.values : []) ?? [];
        const yValues = (setFilterApplied ? (
            item.selectors.find(f => f.fid === yField) as IFilter & { type: 'set' } | undefined
        )?.values : []) ?? [];

        return { xField, yField, rangeFilterApplied, setFilterApplied, xRange, yRange, xValues, yValues };
    }, [item]);

    const spec = useMemo(() => {
        if (item.selectors.length === 0) {
            return {
                ...item.subset,
            };
        }

        return {
            data: item.subset.data,
            layer: [{
                params: item.selectors.length ? [{
                    name: 'brush',
                    value: rangeFilterApplied ? {
                        x: [xRange[0], xRange[1]],
                        y: [yRange[0], yRange[1]],
                    } : undefined,
                    select: {
                        type: 'interval',
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
                mark: item.subset.mark,
                encoding: {
                    ...item.subset.encoding,
                    opacity: { value: 0.33 },
                },
            }, {
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
            }],
        };
    }, [item, rangeFilterApplied, xRange, yRange, xValues, yValues]);

    const signalListeners = useMemo<{
        [key: string]: (name: any, value: any, view: View) => void;
    }>(() => {
        // @see https://github.com/vega/react-vega-lite/issues/7#issuecomment-406105598
        if (!spec.layer) {
            return {};
        }

        const behaviors = spec.layer[0].params?.map(p => p.name) ?? [];

        if (behaviors.length === 0) {
            return {};
        }

        const listeners: { [key: string]: (name: any, value: any, view: View) => void } = {};

        for (const bhv of behaviors) {
            switch (bhv) {
                case 'brush': {
                    listeners['brush'] = (name: 'brush', data: { [fid: string]: [number, number] }) => {
                        // 交互中连续触发
                        if (Object.keys(data).length === 0) {
                            item.selectors = [];
                        }
                    };
                    listeners['brush_tuple'] = (name: 'brush_tuple', data: { fields: { field: string }[]; values: [number, number][] } | null) => {
                        if (data) {
                            // 仅结束时触发，但选中组为空时不触发
                            item.selectors = data.fields.map((f, i) => ({
                                type: 'range',
                                fid: f.field,
                                range: getRange(data.values[i]),
                            }));
                        }
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
                        item.selectors = filters;
                    };
                    break;
                }
                default: {
                    console.warn(`Param name "${bhv}" is not supported.`)
                }
            }
        }

        return listeners;
    }, [spec, item, xField, yField]);

    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const { current: container } = ref;
        if (container) {
            const cb = () => {
                const { width, height } = container.getBoundingClientRect();
                item.size = {
                    w: width,
                    h: height,
                };
            };
            const ro = new ResizeObserver(cb);
            ro.observe(container);
            return () => ro.disconnect();
        }
    }, [item]);

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
                    }}
                    actions={false}
                    signalHandler={signalListeners}
                />
            </VisErrorBoundary>
        </Container>
    );
};

export default observer(DashboardChart);
