import { applyFilters } from '@kanaries/loa';
import { observer } from 'mobx-react-lite';
import type { FC } from 'react';
import { CommandButton } from '@fluentui/react';

import ReactVega from '../../components/react-vega';
import VisErrorBoundary from '../../components/visErrorBoundary';
import type { IFieldMeta, IInsightVizView, IRow } from '../../interfaces';
import type { IFilter } from '../../interfaces';

import type { KanbanItem } from '.';


interface KanbanChartProps {
    dataSource: IRow[];
    fieldMeta: IFieldMeta[];
    vis: IInsightVizView;
    item: Readonly<KanbanItem>;
    filters: IFilter[];
    updateFilters: (filters: IFilter[]) => void;
    toggleFilter: () => void;
    remove: () => void;
    edit: () => void;
}

const KanbanChart: FC<KanbanChartProps> = ({
    item, dataSource, fieldMeta, filters, vis, updateFilters, toggleFilter, remove, edit,
}) => {
    return (
        <>
            <VisErrorBoundary>
                <ReactVega
                    dataSource={applyFilters(dataSource, filters)}
                    spec={item.filter ? {
                        data: vis.spec.data,
                        layer: [{
                            params: item.filter ? [{
                                name: 'brush',
                                value: typeof item.filter === 'object' ? (
                                    item.filter.length === 2 && item.filter[0].type === 'range' && item.filter[1].type === 'range' ? {
                                        x: item.filter[0].range,
                                        y: item.filter[1].range,
                                    } : item.filter.length === 1 && item.filter[0].type === 'range' ? {
                                        x: item.filter[0].range,
                                    } : undefined
                                ) : undefined,
                                select: {
                                    type: 'interval',
                                    // encodings: ['x'],
                                },
                            }, new Array<typeof vis.spec.mark>(
                                'bar', 'arc', 'point', 'circle', 'rect'
                            ).includes((vis.spec.mark as unknown as { type: typeof vis.spec.mark })?.type) && {
                                name: 'select',
                                value: typeof item.filter === 'object' && item.filter[0]?.type === 'set' ? (
                                    item.filter[0].values.map(val => ({
                                        [fieldMeta.find(f => (
                                            (item.filter as (IFilter & { type: 'set' })[])[0].fid === f.fid
                                        ))!.name ?? '']: val,
                                    }))
                                ) : undefined,
                                select: {
                                    type: 'point',
                                },
                            }].filter(Boolean) : undefined,
                            mark: vis.spec.mark,
                            encoding: {
                                ...vis.spec.encoding,
                                opacity: { value: 0.33 },
                            },
                            width: item.chartSize.w,
                            height: item.chartSize.h,
                        }, {
                            transform: [{
                                filter: {
                                    param: typeof item.filter === 'object' && item.filter[0]?.type === 'set' ? 'select' : 'brush',
                                },
                            }],
                            mark: vis.spec.mark,
                            encoding: {
                                ...vis.spec.encoding,
                                opacity: { value: 1 },
                            },
                            width: item.chartSize.w,
                            height: item.chartSize.h,
                        }],
                        width: item.chartSize.w,
                        height: item.chartSize.h,
                    } : {
                        ...vis.spec,
                        width: item.chartSize.w,
                        height: item.chartSize.h,
                    }}
                    actions={false}
                    signalHandler={item.filter ? {
                        brush: (name: 'brush', filters: {
                            [name: string]: [number, number];
                        }) => {
                            const filter = Object.entries(filters).map<IFilter | null>(([k, v]) => {
                                const f = fieldMeta.find(f => f.fid === k);

                                return f ? {
                                    type: 'range',
                                    fid: f.fid,
                                    range: v,
                                } : null;
                            }).filter(Boolean) as IFilter[];

                            updateFilters(filter);
                        },
                        select: (name: 'select', value, view) => {
                            const ids = [...(value as { _vgsid_?: number[] })._vgsid_ ?? []];
                            const items = ['data_1', 'data_0'].map(name => {
                                try {
                                    return view.data(name);
                                } catch (error) {
                                    return [];
                                }
                            }).flat() as { [key: string]: string | number }[];
                            const chosen = items.filter(
                                d => ids.includes(d['_vgsid_'] as number ?? -1)
                            );

                            if (chosen.length) {
                                const keys = Object.keys(chosen[0]);
                                const [key] = keys.filter(k => !['__count', '_vgsid_'].includes(k));
                                const f = fieldMeta.find(f => f.name === key);

                                if (f) {
                                    const filter: IFilter = {
                                        type: 'set',
                                        fid: f.fid,
                                        values: chosen.map(d => d[key]),
                                    };

                                    updateFilters([filter]);

                                    return;
                                }
                            }

                            updateFilters([]);
                        },
                    } : undefined}
                />
            </VisErrorBoundary>
            <div
                className="group"
                style={{ opacity: item.filter ? 1 : undefined }}
                onMouseDown={e => e.stopPropagation()}
            >
                <CommandButton
                    iconProps={{
                        iconName: item.filter ? 'FilterSolid' : 'Filter',
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
            <div
                className="group float"
            >
                <CommandButton
                    iconProps={{
                        iconName: 'Move',
                    }}
                />
            </div>
        </>
    );
};

export default observer(KanbanChart);
