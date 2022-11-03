import { IFilter, ISemanticType } from '@kanaries/loa';
import React, { useEffect, useRef } from 'react';
import { View } from 'vega';
import embed from 'vega-embed';
import { IRow } from '../../../interfaces';
import { throttle } from '../../../utils';

function brush2Filter(brush: { [key: string]: any[] }, semanticType: ISemanticType, fid: string): IFilter | null {
    if (brush[fid] === undefined) {
        return null;
    }
    if (semanticType === 'quantitative' || semanticType === 'temporal')
        return {
            type: 'range',
            fid,
            range: brush[fid] as [number, number],
        };
    return {
        fid,
        type: 'set',
        values: brush[fid],
    };
}

export const BRUSH_SIGNAL_NAME = 'brush';
export interface IBrushSignalStore {
    fields: any[];
    unit: string;
    values: any[];
}
interface ColDistProps {
    data: IRow[];
    fid: string;
    name?: string;
    semanticType: ISemanticType;
    onBrushSignal: (brush: IBrushSignalStore[] | null) => void;
    brush?: null | IBrushSignalStore[];
}
const ColDist: React.FC<ColDistProps> = (props) => {
    const { data, fid, semanticType, onBrushSignal, brush, name } = props;
    const container = useRef<HTMLDivElement>(null);
    const view = useRef<View | null>(null);
    const dataSize = data.length;
    useEffect(() => {
        if (container.current) {
            embed(container.current, {
                data: {
                    values: data,
                    name: 'dataSource',
                },
                width: 200,
                height: 200,
                layer: [
                    {
                        params: [
                            {
                                name: BRUSH_SIGNAL_NAME,
                                select: { type: 'interval', encodings: ['x'] },
                            },
                        ],
                        mark: semanticType === 'temporal' ? 'area' : 'bar',
                        encoding: {
                            x: {
                                field: fid,
                                title: name || fid,
                                bin: semanticType === 'quantitative' ? { maxbins: 20 } : undefined,
                                type: semanticType,
                            },
                            y: { aggregate: 'count' },
                            color: { value: 'gray' },
                        },
                    },
                    {
                        transform: [{ filter: { param: BRUSH_SIGNAL_NAME } }],
                        mark: semanticType === 'temporal' ? 'area' : 'bar',
                        encoding: {
                            x: {
                                field: fid,
                                title: name || fid,
                                bin: semanticType === 'quantitative' ? { maxbins: 20 } : undefined,
                                type: semanticType,
                            },
                            y: { aggregate: 'count' },
                            color: { value: '#531dab' },
                        },
                    },
                ],
            }).then((res) => {
                view.current = res.view;
                const handler = (name: string, value: any) => {
                    if (onBrushSignal) {
                        const state = res.view.getState();
                        if (state.data[`${BRUSH_SIGNAL_NAME}_store`]) {
                            onBrushSignal(state.data[`${BRUSH_SIGNAL_NAME}_store`]);
                        } else {
                            onBrushSignal(null)
                        }
                    }

                    // onFilter && onFilter(brush2Filter(value, semanticType, fid))
                }
                const t = Math.round(dataSize / 1000 * 32)
                const throttleHandler = throttle(handler, t);
                res.view.addSignalListener(BRUSH_SIGNAL_NAME, throttleHandler);
                //@ts-ignore
                // if (typeof window.viz === 'undefined') {
                //     // @ts-ignore
                //     window.viz = {};
                // }

                // // @ts-ignore
                // window.viz[fid] = view.current;
                // console.log(res.view.getState());
            });
        }
    }, [fid, semanticType, dataSize, name]);

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
        if (view.current && brush) {
            const k = `${BRUSH_SIGNAL_NAME}_store`
            view.current.setState({ data: { [k]: brush } });
        }
    }, [brush])
    return <div ref={container}></div>;
};

export default ColDist;
