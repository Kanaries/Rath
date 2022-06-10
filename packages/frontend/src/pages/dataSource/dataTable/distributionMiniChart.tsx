import React, { useRef, useEffect } from 'react';
import embed from 'vega-embed';
import { ISemanticType } from 'visual-insights';
import { IRow } from '../../../interfaces';
export interface DistributionChartProps {
  fieldType: ISemanticType;
  x: string;
  y: string;
  dataSource: IRow[]
}

const DistributionChart: React.FC<DistributionChartProps> = (props) => {
  const chart = useRef<HTMLDivElement>(null);
  const { x, y, dataSource, fieldType } = props;
    useEffect(() => {
      if (chart.current) {
        let values: typeof dataSource = [];
        let hasIndex = false;
        if (fieldType === 'ordinal' && dataSource.some(member => {
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
        } else {
          values = dataSource
        }
        values = values.slice(0, 100)
        let sortBy: string | undefined | any = undefined;
        if (fieldType === 'nominal') {
          sortBy = '-y'
        } else if (fieldType === 'ordinal' && hasIndex) {
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
          mark: ['quantitative', 'temporal'].includes(fieldType) ? 'line' : 'bar',
          encoding: {
            x: {
              field: x,
              title: null,
              axis: null,
              type: fieldType, sort: sortBy
            },
            y: { field: y, type: 'quantitative', aggregate: 'sum', title: null, axis: null }
          }
        }, {
          actions: false
        })
      }
    }, [x, y, dataSource, fieldType])
  return <div ref={chart}></div>
}

export default DistributionChart;