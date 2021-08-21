import React from 'react';
import { observer } from 'mobx-react-lite';
import { GraphicWalker } from 'graphic-walker';
import { useGlobalStore } from '../../store';

const VisualInterface: React.FC = props => {
    const { dataSourceStore } = useGlobalStore();
    // TODO: discuss use clean data from dataSourceStore or cooked data from dataPipeline?
    const { cleanedData, dimensions, measures } = dataSourceStore;
    return <GraphicWalker dataSource={cleanedData} dimensions={dimensions} measures={measures} />
}

export default observer(VisualInterface);