import React, { useMemo } from 'react';

import { observer } from 'mobx-react-lite'
import BaseChart from '../../visBuilder/vegaBase';
import { useGalleryStore } from './store';

const ObserverChart: React.FC = () => {
    const store = useGalleryStore();
    const { visualConfig, vizRecommand } = store;
    const { aggregator, defaultAggregated, defaultStack } = visualConfig;
    const { dimensions, measures, aggData, schema, fieldFeatures } = vizRecommand;

    const fields = useMemo(() => {
        return fieldFeatures.map((f) => ({ ...f, name: f.fieldName }));
    }, [fieldFeatures])

    return (
        <BaseChart
            aggregator={aggregator}
            defaultAggregated={defaultAggregated}
            defaultStack={defaultStack}
            dimensions={dimensions}
            measures={measures}
            dataSource={aggData}
            schema={schema}
            fieldFeatures={fields}
        />
    );
}

export default observer(ObserverChart);