import { ISemanticType } from '@kanaries/loa';
import React, { useEffect, useRef } from 'react';
import { View } from 'vega';
import embed from 'vega-embed';
import { IRow } from '../../../../interfaces';
import { throttle } from '../../../../utils';

export const SELECT_SIGNAL_NAME = '__select__';
export interface IBrushSignalStore {
    fields: any[];
    unit: string;
    values: any[];
}
interface ColDistProps {
    data: readonly IRow[];
    fid: string;
    name?: string;
    semanticType: ISemanticType;
    onBrushSignal: (brush: IBrushSignalStore[] | null) => void;
    brush?: null | IBrushSignalStore[];
    /** @default 200 */
    width?: number;
    /** @default 200 */
    height?: number;
    /** @default true */
    actions?: boolean;
    /** @default false */
    onlyTicks?: boolean;
}
const DEFAULT_AXIS: any = {
    labelLimit: 52,
    labelOverlap: 'parity',
    ticks: false,
};
const ColDist: React.FC<ColDistProps> = (props) => {
    const {
        data,
        fid,
        semanticType,
        onBrushSignal,
        brush,
        name,
        width = 200,
        height = 200,
        actions = false,
        onlyTicks = false,
    } = props;
    const container = useRef<HTMLDivElement>(null);
    const view = useRef<View | null>(null);
    const dataSize = data.length;
    const filterType = semanticType === 'quantitative' || semanticType === 'temporal' ? 'interval' : 'point';
    useEffect(() => {
        if (container.current) {
            const shouldXLabelsDisplayFull = semanticType === 'quantitative';
            embed(container.current, {
                data: {
                    values: data,
                    name: 'dataSource',
                },
                width,
                height,
                autosize: {
                    type: 'fit',
                    contains: 'padding',
                },
                layer: [
                    {
                        params: [
                            {
                                name: SELECT_SIGNAL_NAME,
                                select: { type: filterType, encodings: ['x'] },
                            },
                        ],
                        mark: {
                            type: semanticType === 'temporal' ? 'area' : 'bar',
                            tooltip: true,
                        },
                        encoding: {
                            x: {
                                field: fid,
                                title: name || fid,
                                bin: semanticType === 'quantitative' || semanticType === 'temporal' ? { maxbins: 20 } : undefined,
                                type: semanticType,
                                axis: onlyTicks ? {
                                    title: null,
                                } : DEFAULT_AXIS,
                            },
                            y: {
                                aggregate: 'count',
                                axis: onlyTicks ? null : DEFAULT_AXIS,
                            },
                            color: { value: 'gray' },
                        },
                    },
                    {
                        transform: [
                            { filter: { param: SELECT_SIGNAL_NAME } },
                        ],
                        mark: {
                            type: semanticType === 'temporal' ? 'area' : 'bar',
                            tooltip: true,
                        },
                        encoding: {
                            x: {
                                field: fid,
                                title: name || fid,
                                bin: semanticType === 'quantitative' || semanticType === 'temporal' ? { maxbins: 20 } : undefined,
                                type: semanticType,
                                axis: onlyTicks ? {
                                    title: null,
                                    labelLimit: shouldXLabelsDisplayFull ? undefined : height * 0.4,
                                } : DEFAULT_AXIS
                            },
                            y: { aggregate: 'count', axis: DEFAULT_AXIS },
                            color: { value: '#531dab' },
                        },
                    },
                ],
            },
                { actions: false }
            ).then((res) => {
                view.current = res.view;
                const handler = (name: string, value: any) => {
                    if (onBrushSignal) {
                        const state = res.view.getState();
                        if (state.data[`${SELECT_SIGNAL_NAME}_store`]) {
                            onBrushSignal(state.data[`${SELECT_SIGNAL_NAME}_store`]);
                        } else {
                            onBrushSignal(null);
                        }
                    }
                };
                const t = Math.round((dataSize / 1000) * 32);
                const throttleHandler = throttle(handler, t);
                res.view.addSignalListener(SELECT_SIGNAL_NAME, throttleHandler);
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fid, semanticType, dataSize, name, width, height, actions, onlyTicks, filterType]);

    useEffect(() => {
        if (view.current) {
            view.current.change(
                'dataSource',
                view.current
                    .changeset()
                    .remove(() => true)
                    .insert(data)
            );
        }
    }, [data]);

    useEffect(() => {
        if (view.current) {
            const k = `${SELECT_SIGNAL_NAME}_store`;
            if (brush !== null) {
                view.current.setState({ data: { [k]: brush } });
            }
        }
    }, [brush]);
    return <div ref={container}></div>;
};

export default ColDist;
