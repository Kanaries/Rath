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
      embed(chart.current, {
        background: '#fff',
        data: {
          values: dataSource
        },
        height: 120,
        width: 240,
        mark: ['quantitative', 'temporal'].includes(fieldType) ? 'line' : 'bar',
        encoding: {
          x: { field: x,
            axis: null,
            type: fieldType, sort: fieldType === 'nominal' ? '-y' : undefined },
          y: { field: y, type: 'quantitative', aggregate: 'sum' }
        }
      }, {
        actions: false
      })
    }
  }, [x, y, dataSource])
  return <div ref={chart}></div>
}

export default DistributionChart;