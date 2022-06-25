import React, { useRef, useEffect, useMemo, useState } from 'react';
import embed, { vega, Result } from 'vega-embed';
import { IAnalyticType, ISemanticType } from 'visual-insights';
import { IRow } from '../../../interfaces';
import { getRange } from '../../../utils';

const DATA_NAME = 'dataSource';

function fl2bins(data: IRow[], valueField: string, ctField: string) {
    const values: number[] = data.map(row => Number(row[valueField]));
    const [_min, _max] = getRange(values)
    const BIN_SIZE = 8;
    const bins: number[] = new Array(BIN_SIZE + 1).fill(0);
    const step = (_max - _min) / BIN_SIZE;
    for (let i = 0; i < data.length; i++) {
        const index = Math.floor((values[i] - _min) / step);
        bins[index] += data[i][ctField];
    }
    bins[BIN_SIZE - 1] += bins[BIN_SIZE]
    bins.pop();
    return bins.map((b, i) => ({
        [valueField]: `[${i + 1}]${Math.round(_min + i * step)}`,
        [ctField]: b
    }))
}
export interface DistributionChartProps {
    semanticType: ISemanticType;
    analyticType: IAnalyticType;
    x: string;
    y: string;
    dataSource: IRow[]
}

const DistributionChart: React.FC<DistributionChartProps> = (props) => {
    const chart = useRef<HTMLDivElement>(null);
    const { x, y, dataSource, semanticType } = props;
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
            adjustData = [...dataSource].sort((a, b) => b['y'] - a['y']).slice(0, 8)
        } else if (semanticType === 'quantitative') {
            adjustData = fl2bins(dataSource, x, y)
        } else {
            adjustData = dataSource
        }
        adjustData = adjustData.slice(0, 100)
        return adjustData
    }, [dataSource, x, y, semanticType])

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
            embed(chart.current, {
                background: 'rgba(0,0,0,0)',
                data: {
                    name: DATA_NAME
                },
                view: {
                    stroke: null,
                    fill: null
                },
                height: 80,
                width: 180,
                mark: {
                    type: ['quantitative', 'temporal'].includes(semanticType) ? 'area' : 'bar',
                    opacity: 0.86
                },
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
                        //   axis: null,    
                        type: semanticType === 'quantitative' ? 'ordinal' : semanticType, sort: sortBy
                    },
                    y: { field: y, type: 'quantitative', aggregate: 'sum', title: null, axis: null }
                }
            }, {
                actions: false
            }).then(res => {
                setView(res.view);
            })
        }
    }, [x, y, sortBy, semanticType])
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

export default DistributionChart;