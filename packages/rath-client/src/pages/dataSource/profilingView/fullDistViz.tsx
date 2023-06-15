import { getRange, IAnalyticType, ISemanticType } from '@kanaries/loa';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import embed, { Result, vega } from 'vega-embed';
import intl from 'react-intl-universal';
import { IRow } from '../../../interfaces';
import { shallowCopyArray } from '../../../utils/deepcopy';
import { getVegaTimeFormatRules } from '../../../utils';
import { VegaGlobalConfig } from '../../../queries/themes/config';
const DATA_NAME = 'dataSource';
const DEFAULT_BIN_SIZE = 10;
const markColor = '#3371D7';
const theme: VegaGlobalConfig = {
    arc: { fill: markColor },
    area: { fill: markColor },
    path: { stroke: markColor },
    rect: { fill: markColor },
    shape: { stroke: markColor },
    symbol: { stroke: markColor },
    circle: { fill: markColor },
    bar: { fill: markColor },
    point: { fill: markColor },
    tick: { fill: markColor },
    line: { fill: markColor },
}
function fl2bins(data: IRow[], valueField: string, ctField: string, binSize: number | undefined = DEFAULT_BIN_SIZE) {
    const values: number[] = data.map(row => Number(row[valueField]));
    const [_min, _max] = getRange(values)
    const bins: number[] = new Array(binSize + 1).fill(0);
    const step = (_max - _min) / binSize;
    for (let i = 0; i < data.length; i++) {
        const index = Math.floor((values[i] - _min) / step);
        bins[index] += data[i][ctField];
    }
    bins[binSize - 1] += bins[binSize]
    bins.pop();
    return bins.map((b, i) => ({
        [valueField]: Math.round(_min + i * step),
        [ctField]: b
    }))
}
interface FullDistVizProps {
    semanticType: ISemanticType;
    analyticType: IAnalyticType;
    x: string;
    y: string;
    width?: number;
    height?: number;
    maxItemInView?: number;
    dataSource: IRow[];
    onSelect: (values: IRow[]) => void;
}
const FullDistViz: React.FC<FullDistVizProps> = (props) => {
    const chart = useRef<HTMLDivElement>(null);
    const { x, y, dataSource, semanticType, width = 180, height = 80, maxItemInView = 1000, onSelect } = props;
    const [view, setView] = useState<Result['view']>();
    // 是否有分箱的ordinal列
    const hasBinIndex = useMemo(() => {
        return dataSource.some(member => {
            return /(\[|\()-?([0-9.]+|Infinity),\s*([0-9.]+|Infinity)(\]|\))/.test(member.memberName)
        })
    }, [dataSource])

    const values = useMemo(() => {
        let adjustData: IRow[] = [];
        if (semanticType === 'ordinal' && dataSource.some(member => {
            return /(\[|\()-?([0-9.]+|Infinity),\s*([0-9.]+|Infinity)(\]|\))/.test(member.memberName)
        })) {
            adjustData = dataSource.map(member => {
                let result = /(\[|\()(?<left>-?([0-9.]+|Infinity)),\s*([0-9.]+|Infinity)(\]|\))/.exec(member.memberName);

                return {
                    ...member,
                    index: result === null ? member.name : Number(result.groups!.left)
                }
            })
        } else if (semanticType === 'nominal') {
            adjustData = shallowCopyArray(dataSource).sort((a, b) => b['y'] - a['y']).slice(0, maxItemInView)
        } else if (semanticType === 'quantitative') {
            adjustData = fl2bins(dataSource, x, y, 10)
        } else {
            adjustData = dataSource
        }
        return adjustData
    }, [dataSource, x, y, semanticType, maxItemInView])

    const sortBy = useMemo(() => {
        let sortBy: string | undefined | any = undefined;
        if (semanticType === 'nominal') {
            sortBy = '-y'
        } else if (semanticType === 'ordinal' && hasBinIndex) {
            sortBy = { field: 'index' }
        }
        return sortBy
    }, [semanticType, hasBinIndex])

    useEffect(() => {
        if (chart.current) {
            const resultPromise = embed(chart.current, {
                background: 'rgba(0,0,0,0)',
                data: {
                    name: DATA_NAME
                },
                height,
                width,
                mark: {
                    type: ['temporal'].includes(semanticType) ? 'area' : 'bar',
                    opacity: 0.86
                },
                params: [
                    {
                        name: 'brush',
                        select: { type: 'interval', encodings: ['x']},
                    }
                ],
                encoding: {
                    x: {
                        field: x,
                        title: null,
                        axis: {
                            // "labelAngle": 0,
                            labelLimit: 52,
                            "labelOverlap": "parity",
                            ticks: false
                        },
                        type: semanticType === 'quantitative' ? 'ordinal' : semanticType, sort: sortBy
                    },
                    y: { field: y, type: 'quantitative', aggregate: 'sum', title: null },
                    color: semanticType !== 'temporal' ? {
                        condition: {
                            param: 'brush',
                        },
                        value: 'gray'
                    } : undefined
                }
            }, {
                actions: false,
                timeFormatLocale: getVegaTimeFormatRules(intl.get('time_format.langKey')) as any,
                config: theme
            }).then(res => {
                setView(res.view);
                res.view.addSignalListener('brush', (name, value) => {
                    onSelect(value[x] || [])
                })
                return res
            })
            return () => {
                resultPromise.then(res => {
                  if (res) {
                    res.finalize()
                  }
                }).catch(console.error)
            }
        }
    }, [x, y, sortBy, semanticType, width, height, maxItemInView, onSelect])
    useEffect(() => {
        if (view) {
            try {
                view.change('dataSource', vega.changeset().remove(() => true).insert(values));
                view.resize();
                view.runAsync();   
            } catch (error) {
                console.error(error)
            }
        }
    }, [values, view])
    return <div ref={chart}></div>
}

export default FullDistViz;