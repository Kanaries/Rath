import React, { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { GraphicWalker } from '@kanaries/graphic-walker';
import { IMutField } from '@kanaries/graphic-walker/dist/interfaces';
import { useGlobalStore } from '../../store';
import '@kanaries/graphic-walker/dist/style.css';

const VisualInterface: React.FC = (props) => {
    const { dataSourceStore, commonStore, langStore } = useGlobalStore();
    // TODO: [discuss] discuss use clean data from dataSourceStore or cooked data from dataPipeline?
    const { cleanedData, fields } = dataSourceStore;
    const { graphicWalkerSpec } = commonStore;
    const gwRawFields = useMemo<IMutField[]>(() => {
        return fields.map((f) => {
            return {
                fid: f.fid,
                name: f.name,
                semanticType: f.semanticType,
                dataType: '?',
                analyticType: f.analyticType,
            };
        });
    }, [fields]);
    return (
        <GraphicWalker
            dataSource={cleanedData}
            rawFields={gwRawFields}
            spec={graphicWalkerSpec}
            i18nLang={langStore.lang}
            keepAlive
        />
    );
};

export default observer(VisualInterface);
