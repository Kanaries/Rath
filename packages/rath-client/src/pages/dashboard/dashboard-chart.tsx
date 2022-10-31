import { applyFilters } from '@kanaries/loa';
import { observer } from 'mobx-react-lite';
import { FC, useMemo } from 'react';
import { CommandButton } from '@fluentui/react';
import type { View } from 'vega';

import ReactVega from '../../components/react-vega';
import VisErrorBoundary from '../../components/visErrorBoundary';
import type { IRow, IVegaSubset } from '../../interfaces';
import type { IFilter } from '../../interfaces';
import type { DashboardItem } from '../../store/dashboardStore';


interface DashboardChartProps {
    dataSource: IRow[];
    subset: IVegaSubset;
    item: Readonly<DashboardItem>;
    filters: IFilter[];
    updateFilters: (filters: IFilter[]) => void;
    toggleFilter: () => void;
    remove: () => void;
    edit: () => void;
}

const DashboardChart: FC<DashboardChartProps> = ({
    item, dataSource, filters, subset, updateFilters, toggleFilter, remove, edit,
}) => {
    const data = useMemo(() => applyFilters(dataSource, filters), [dataSource, filters]);

    const { xField, yField, rangeFilterApplied, xRange, yRange, xValues, yValues } = useMemo(() => {
        const xField = subset.encoding.x?.field;
        const yField = subset.encoding.y?.field;

        const anyFilterApplied = item.filter.enabled && item.filter.data.length > 0;
        const rangeFilterApplied = anyFilterApplied && item.filter.data.every(f => f.type === 'range');
        const setFilterApplied = anyFilterApplied && item.filter.data.every(f => f.type === 'set');

        const xRange = (rangeFilterApplied ? (
            item.filter.data.find(f => f.fid === xField) as IFilter & { type: 'range' } | undefined
        )?.range : undefined) ?? [-Infinity, Infinity];
        const yRange = (rangeFilterApplied ? (
            item.filter.data.find(f => f.fid === yField) as IFilter & { type: 'range' } | undefined
        )?.range : undefined) ?? [-Infinity, Infinity];

        const xValues = (setFilterApplied ? (
            item.filter.data.find(f => f.fid === xField) as IFilter & { type: 'set' } | undefined
        )?.values : []) ?? [];
        const yValues = (setFilterApplied ? (
            item.filter.data.find(f => f.fid === yField) as IFilter & { type: 'set' } | undefined
        )?.values : []) ?? [];

        return { xField, yField, rangeFilterApplied, setFilterApplied, xRange, yRange, xValues, yValues };
    }, [subset, item]);

    const spec = useMemo(() => {
        if (item.filter.enabled === false) {
            return {
                ...subset,
                width: item.chartSize.w,
                height: item.chartSize.h,
            };
        }

        return {
            data: subset.data,
            layer: [{
                params: item.filter.enabled ? [{
                    name: 'brush',
                    value: rangeFilterApplied ? {
                        x: [xRange[0], xRange[1]],
                        y: [yRange[0], yRange[1]],
                    } : undefined,
                    select: {
                        type: 'interval',
                    },
                }, new Array<typeof subset.mark>(
                    'bar', 'arc', 'point', 'circle', 'rect'
                ).includes((subset.mark as unknown as { type: typeof subset.mark })?.type) && {
                    name: 'sl',
                    value: {
                        x: xValues,
                        y: yValues,
                    },
                    select: {
                        type: 'point',
                    },
                }].filter(Boolean) as ({ name: string })[] : undefined,
                mark: subset.mark,
                encoding: {
                    ...subset.encoding,
                    opacity: { value: 0.33 },
                },
                width: item.chartSize.w,
                height: item.chartSize.h,
            }, {
                transform: [{
                    filter: {
                        param: item.filter.enabled && item.filter.data[0]?.type === 'set' ? 'sl' : 'brush',
                    },
                }],
                mark: subset.mark,
                encoding: {
                    ...subset.encoding,
                    opacity: { value: 1 },
                },
            }],
            width: item.chartSize.w,
            height: item.chartSize.h,
        };
    }, [item.filter, item.chartSize, subset, rangeFilterApplied, xRange, yRange, xValues, yValues]);

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
                            updateFilters([]);
                        }
                    };
                    listeners['brush_tuple'] = (name: 'brush_tuple', data: { fields: { field: string }[]; values: [number, number][] } | null) => {
                        if (data) {
                            // 仅结束时触发，但选中组为空时不触发
                            updateFilters(data.fields.map((f, i) => ({
                                type: 'range',
                                fid: f.field,
                                range: [
                                    Math.min(...data.values[i]),
                                    Math.max(...data.values[i]),
                                ],
                            })));
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
                        updateFilters(filters);
                    };
                    break;
                }
                default: {
                    console.warn(`Param name "${bhv}" is not supported.`)
                }
            }
        }

        return listeners;
    }, [spec, updateFilters, xField, yField]);

    return (
        <>
            <div onMouseDown={e => e.stopPropagation()}>
                <VisErrorBoundary>
                    <ReactVega
                        dataSource={data}
                        spec={spec}
                        actions={false}
                        signalHandler={item.filter.enabled ? signalListeners : undefined}
                    />
                </VisErrorBoundary>
            </div>
            <div
                className="group"
                style={{ opacity: item.filter.enabled ? 1 : undefined }}
                onMouseDown={e => e.stopPropagation()}
            >
                <CommandButton
                    iconProps={{
                        iconName: item.filter.enabled ? 'FilterSolid' : 'Filter',
                    }}
                    onClick={toggleFilter}
                />
                <CommandButton
                    iconProps={{
                        iconName: 'Edit',
                    }}
                    onClick={edit}
                />
                <CommandButton
                    iconProps={{
                        iconName: 'Photo2Remove',
                        style: {
                            color: '#fff',
                        },
                    }}
                    onClick={remove}
                    style={{
                        backgroundColor: 'rgb(197, 15, 31)',
                        marginLeft: '0.6em',
                    }}
                />
            </div>
            <div className="group float">
                <CommandButton
                    iconProps={{
                        iconName: 'Move',
                    }}
                />
            </div>
        </>
    );
};

export default observer(DashboardChart);
