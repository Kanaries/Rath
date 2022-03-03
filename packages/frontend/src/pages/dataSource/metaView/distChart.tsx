import React, { useRef, useEffect } from 'react';
import embed from 'vega-embed';
import { IAnalyticType, ISemanticType } from 'visual-insights';
import { FieldType, DataSource } from '../../../global';
import { IRow } from '../../../interfaces';

function fl2bins (data: IRow[], valueField: string, ctField: string) {
    const values: number[] = data.map(row => row[valueField]);
    const _min = Math.min(...values);
    const _max = Math.max(...values);
    const BIN_SIZE = 8;
    const bins: number[] = new Array(BIN_SIZE + 1).fill(0);
    const step = (_max - _min) / BIN_SIZE;
    for (let i = 0; i < data.length; i++) {
        const index = Math.floor((values[i] - _min) / step);
        bins[index]+=data[i][ctField];
    }
    bins[BIN_SIZE - 1] += bins[BIN_SIZE]
    bins.pop();
    return bins.map((b, i) => ({
        [valueField]: `${Math.round(_min + i * step)}[${i + 1}]`,
        [ctField]: b
    }))
}
export interface DistributionChartProps {
  semanticType: ISemanticType;
  analyticType: IAnalyticType;
  x: string;
  y: string;
  dataSource:  IRow[]
}

const DistributionChart: React.FC<DistributionChartProps> = (props) => {
  const chart = useRef<HTMLDivElement>(null);
  const { x, y, dataSource, analyticType, semanticType } = props;
    useEffect(() => {
      if (chart.current) {
        let values: typeof dataSource = [];
        let hasIndex = false;
        if (semanticType === 'ordinal' && dataSource.some(member => {
          return /(\[|\()-?([0-9.]+|Infinity),\s*([0-9.]+|Infinity)(\]|\))/.test(member.memberName)
        })) {
          values = dataSource.map(member => {
            hasIndex = true;
            let result = /(\[|\()(?<left>-?([0-9.]+|Infinity)),\s*([0-9.]+|Infinity)(\]|\))/.exec(member.memberName);
            
            return {
              ...member,
              index: result === null ? member.name : Number(result.groups!.left)
            }
          })
        } else if (semanticType === 'nominal') {
            values = [...dataSource].sort((a, b) => b['y'] - a['y']).slice(0, 8)
        } else if (semanticType === 'quantitative') {
            values = fl2bins(dataSource, x, y)
        } else {
          values = dataSource
        }
        let sortBy: string | undefined | any = undefined;
        if (semanticType === 'nominal') {
          sortBy = '-y'
        } else if (semanticType === 'ordinal' && hasIndex) {
          sortBy = { field: 'index' }
        }
        embed(chart.current, {
          background: 'rgba(0,0,0,0)',
          data: {
            values
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
                labelLimit: 56,
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
        })
      }
    }, [x, y, dataSource, semanticType])
  return <div ref={chart}></div>
}

export default DistributionChart;