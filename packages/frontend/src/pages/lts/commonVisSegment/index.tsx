import React from 'react';
import BaseChart, { BaseChartProps } from '../../../visBuilder/vegaBase';
import MeasureCard from './measureCard';

type CommonVisSegmentBase = Pick<BaseChartProps,
    'aggregator' |
    'dataSource' |
    'defaultAggregated' |
    'defaultStack' |
    'dimensions' |
    'measures' |
    'fieldFeatures' |
    'schema'
>

const aggregators = {
    sum: (nums: number[]) => nums.reduce((t, c) => t + c, 0),
    mean: (nums: number[]) => nums.reduce((t, c) => t + c, 0) / nums.length,
    count: (nums: number[]) => nums.length
} as const;

function formatter (num: number): number | string | undefined {
    if (Math.abs(num) >= 1) {
        if (Math.abs(num) - Math.abs(Math.floor(num)) < 0.0001) return Math.round(num)
        return num.toFixed(2)
    }
    if (Math.abs(num) < 1) return num;
}

interface CVSProps extends CommonVisSegmentBase {
    // aggregators: Array<'sum' | 'mean' | 'count'>
}

const CommonVisSegment: React.FC<CVSProps> = props => {
    const { dimensions, measures, schema, fieldFeatures, defaultStack, defaultAggregated, dataSource } = props;
    const measureNames = measures.map(mea => `${fieldFeatures.find(f => f.fid === mea)?.name || mea}`)
    return <div style={{ overflow: 'auto', marginTop: '1em', display: 'flex', flexWrap: 'wrap' }}>
        {
            dimensions.length > 0 && (['sum', 'mean', 'count'] as const).map(a => <div key={a}>
                <div>{a}</div>
                <BaseChart
                    defaultAggregated={defaultAggregated}
                    defaultStack={defaultStack}
                    dimensions={dimensions}
                    measures={measures}
                    dataSource={dataSource}
                    schema={schema}
                    fieldFeatures={fieldFeatures}
                    aggregator={a}
                    mode="common"
                    // viewSize={320}
                    // stepSize={32}
                />
            </div>)
        }
        {
            dimensions.length === 0 && (['sum', 'mean', 'count'] as const).map(op => <div key={op}>
                {
                    measures.map((mea, meaIndex) => <MeasureCard key={mea} headerText={`${op.toUpperCase()} | ${measureNames[meaIndex]}`} contentText={`${formatter(aggregators[op](dataSource.map(r => r[mea]) as number[]))}`}/>)
                }

            </div>
            )
        }
    </div>
}

export default CommonVisSegment;