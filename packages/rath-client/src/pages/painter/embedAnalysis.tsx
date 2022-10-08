import React from 'react';
import { GraphicWalker } from '@kanaries/graphic-walker';
import '@kanaries/graphic-walker/dist/style.css';
import { Specification } from 'visual-insights';
import { IMutField } from '@kanaries/graphic-walker/dist/interfaces';
import { IRow } from '../../interfaces';

interface EmbedAnalysisProps {
    dataSource: IRow[];
    fields: IMutField[];
    spec: Specification;
    trigger?: boolean;
    i18nLang?: string;
}

const EmbedAnalysis: React.FC<EmbedAnalysisProps> = props => {
    const { dataSource, fields, spec, trigger, i18nLang } = props;
    return <GraphicWalker
        dataSource={dataSource}
        rawFields={fields}
        spec={spec}
        i18nLang={i18nLang}
        hideDataSourceConfig
    />
}

export default EmbedAnalysis;