import React, { useRef, useEffect } from 'react';
import embed from 'vega-embed';
import { FieldType, DataSource } from '../../global';
export interface DistributionChartProps {
  fieldType: FieldType;
  x: string;
  y: string;
  dataSource: DataSource
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
        let sortBy: string | undefined | any = undefined;
        if (fieldType === 'nominal') {
          sortBy = '-y'
        } else if (fieldType === 'ordinal' && hasIndex) {
          sortBy = { field: 'index' }
        }
        embed(chart.current, {
          background: '#fff',
          data: {
            values
          },
          height: 120,
          width: 200,
          mark: ['quantitative', 'temporal'].includes(fieldType) ? 'line' : 'bar',
          encoding: {
            x: {
              field: x,
              axis: dataSource.length > 16 ? null : undefined,
              type: fieldType, sort: sortBy
            },
            y: { field: y, type: 'quantitative', aggregate: 'sum' }
          }
        }, {
          actions: false
        })
      }
    }, [x, y, dataSource, fieldType])
  return <div ref={chart}></div>
}

export default DistributionChart;