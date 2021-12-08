import React from 'react';
import BaseChart, { BaseChartProps } from '../../../visBuilder/vegaBase';
// import 
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

interface CVSProps extends CommonVisSegmentBase {
    // aggregators: Array<'sum' | 'mean' | 'count'>
}

const CommonVisSegment: React.FC<CVSProps> = props => {
    const { dimensions, measures, schema, fieldFeatures, defaultStack, defaultAggregated, dataSource } = props;
    return <div>
        {
            (['sum', 'mean', 'count'] as const).map(a => <BaseChart
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
            />)
        }
    </div>
}

export default CommonVisSegment;