import React, { useMemo } from 'react';

import { observer } from 'mobx-react-lite'
import BaseChart from '../../visBuilder/vegaBase';
import { useGlobalStore } from '../../store';
import { useEffect } from 'react';
import { config } from 'rxjs';

// TODO: 这里有针对散点图类型的聚合逻辑调整，
// 后续这部分逻辑要讨论之后，集成在引擎层，是否聚合要有推荐的值，而不是用默认值或用户指定
// 针对部分视图，要有自动的采样机制（允许用户配置），避免视图渲染崩溃。（这部分逻辑在应用层，不要交给引擎层）
const ObserverChart: React.FC = () => {
    const { galleryStore } = useGlobalStore()
    const { visualConfig, vizRecommand } = galleryStore;
    const { aggregator, defaultAggregated, defaultStack } = visualConfig;
    const { dimensions, measures, aggData, schema, fieldFeatures } = vizRecommand;

    const fields = useMemo(() => {
        return fieldFeatures.map((f) => ({ ...f, name: f.fieldName }));
    }, [fieldFeatures])

    // schema发生变化（当前视图）时，提供一个默认聚合的调整。
    useEffect(() => {
        if (schema.position?.every(c => measures.includes(c))) {
            galleryStore.changeVisualConfig(config => {
                config.defaultAggregated = false;
            });
        } else {
            galleryStore.changeVisualConfig(config => {
                config.defaultAggregated = true;
            });
        }
    }, [schema, measures, galleryStore])

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