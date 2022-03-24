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
    return <div style={{ overflow: 'auto', marginTop: '1em', display: 'flex', flexWrap: 'wrap' }}>
        {
            (['sum', 'mean', 'count'] as const).map(a => <div key={a}>
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
    </div>
}

export default CommonVisSegment;