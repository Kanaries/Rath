import React from 'react';
import { observer } from 'mobx-react-lite';
import { GraphicWalker } from 'graphic-walker';
import { useGlobalStore } from '../../store';
import { useMemo } from 'react';
import { IMutField } from 'graphic-walker/dist/interfaces';
import 'graphic-walker/dist/style.css';

const VisualInterface: React.FC = props => {
    const { dataSourceStore } = useGlobalStore();
    // TODO: discuss use clean data from dataSourceStore or cooked data from dataPipeline?
    const { cleanedData, mutFields } = dataSourceStore;
    const gwRawFields = useMemo<IMutField[]>(() => {
        return mutFields.map(f => {
            return {
                key: f.fid,
                semanticType: f.semanticType,
                dataType: '?',
                analyticType: f.analyticType
            }
        })
    }, [mutFields])
    return <GraphicWalker dataSource={cleanedData} rawFields={gwRawFields} />
}

export default observer(VisualInterface);