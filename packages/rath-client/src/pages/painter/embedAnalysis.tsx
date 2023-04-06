import React, { useMemo } from 'react';
import { GraphicWalker } from '@kanaries/graphic-walker';
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

    const triggerFields = useMemo(() => {
        return [...fields]
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trigger, fields])
    return <GraphicWalker
        dataSource={dataSource}
        rawFields={triggerFields}
        spec={spec}
        i18nLang={i18nLang}
        hideDataSourceConfig
        keepAlive
        dark="light"
        fieldKeyGuard={false}
    />
}

export default EmbedAnalysis;