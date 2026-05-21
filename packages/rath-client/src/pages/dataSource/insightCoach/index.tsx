import { useEffect, useMemo, useRef, useState } from 'react';
import type { FC } from 'react';
import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import { MessageBar, MessageBarType, Spinner, Stack } from '@fluentui/react';
import { Button } from '@fluentui/react-components';
import { Lightbulb, Play, Sparkles, Workflow, Wand2, Waypoints } from 'lucide-react';
import { useGlobalStore } from '../../../store';
import { Card } from '../../../components/card';
import { getInsightExpl } from '../../../services/insights';
import { useActionModes } from '../baseActions/mainActionButton';
import type { IFieldMeta } from '../../../interfaces';
import { PIVOT_KEYS } from '../../../constants';

type NarrativeInsight = {
    score: number;
    para?: {
        explain?: string;
    };
};

type NarrativeResponseRow = Record<string, NarrativeInsight>;

const CoachLayout = styled.div`
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;

    .titleRow {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 8px;
    }

    .title {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 1.1em;
        font-weight: 600;
    }

    .subtitle {
        color: #5b5b5b;
        margin: 6px 0 0 0;
        line-height: 1.35;
    }

    .sectionTitle {
        font-weight: 600;
        margin: 12px 0 6px 0;
    }

    .pillRow {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
    }

    .pill {
        padding: 4px 10px;
        border-radius: 999px;
        background: #f5f7fa;
        border: 1px solid #e9ebf0;
        font-size: 12px;
    }

    .explainList {
        margin: 0;
        padding-left: 18px;
        color: #2e2e2e;
        line-height: 1.35;
    }

    .actionsRow {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 8px;
    }
`;

function describeStartMode(key: string): string {
    switch (key) {
        case 'function.analysis.start':
            return intl.get('coach.insight.startMode.start');
        case 'function.analysis.checkResult':
            return intl.get('coach.insight.startMode.checkResult');
        case 'function.analysis.pattern':
            return intl.get('coach.insight.startMode.pattern');
        case 'function.analysis.manual':
            return intl.get('coach.insight.startMode.manual');
        case 'function.analysis.causal':
            return intl.get('coach.insight.startMode.causal');
        default:
            return intl.get('coach.insight.startMode.default');
    }
}

const SAMPLE_ROWS_FOR_NARRATIVE = 800;

const InsightCoach: FC = () => {
    const { dataSourceStore, langStore, commonStore } = useGlobalStore();
    const { startMode, analysisOptions, satisfyAnalysisCondition } = useActionModes();

    const { cleanedData, fieldMetas, meaFields, dimFields, rawDataMetaInfo } = dataSourceStore;

    const hasData = rawDataMetaInfo.length > 0 && cleanedData.length > 0;
    const largeDataset = cleanedData.length >= 5000;
    const primaryDim = useMemo(() => dimFields.find((f) => f.fid !== '__index__'), [dimFields]);
    const primaryMea = useMemo(() => meaFields[0], [meaFields]);

    const fieldsForNarrative = useMemo<IFieldMeta[]>(() => {
        const fmMap = new Map(fieldMetas.map((f) => [f.fid, f]));
        const picked: IFieldMeta[] = [];
        if (primaryDim?.fid) {
            const f = fmMap.get(primaryDim.fid);
            if (f) picked.push(f);
        }
        if (primaryMea?.fid) {
            const f = fmMap.get(primaryMea.fid);
            if (f) picked.push(f);
        }
        return picked;
    }, [fieldMetas, primaryDim?.fid, primaryMea?.fid]);

    const [explainLoading, setExplainLoading] = useState(false);
    const [viewInfo, setViewInfo] = useState<NarrativeResponseRow[]>([]);
    const requestId = useRef<number>(0);

    useEffect(() => {
        if (!hasData) {
            setViewInfo([]);
            setExplainLoading(false);
        }
    }, [hasData]);

    useEffect(() => {
        if (!hasData) return;
        if (fieldsForNarrative.length < 2) return;
        setViewInfo([]);
        // Keep payload small enough to be responsive.
        const sampled = cleanedData.slice(0, SAMPLE_ROWS_FOR_NARRATIVE);
        getInsightExpl({
            requestId,
            dataSource: sampled,
            fields: fieldsForNarrative,
            aggrType: 'mean',
            langType: langStore.lang ?? 'en-US',
            setExplainLoading,
            resolveInsight: setViewInfo,
        });
    }, [hasData, fieldsForNarrative, cleanedData, langStore.lang]);

    const explains = useMemo(() => {
        if (!viewInfo || viewInfo.length === 0) return [];
        const top = Object.keys(viewInfo[0])
            .filter((k: string) => viewInfo[0]?.[k]?.score > 0)
            .map((k: string) => ({
                score: viewInfo[0][k].score,
                type: k,
                explain: viewInfo[0][k].para?.explain ?? '',
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);
        return top;
    }, [viewInfo]);

    return (
        <Card backgroundColor="#ffffff">
            <CoachLayout>
                <div className="titleRow">
                    <div>
                        <div className="title">
                            <Sparkles size={18} />
                            <span>{intl.get('coach.insight.title')}</span>
                        </div>
                        <p className="subtitle">
                            {intl.get('coach.insight.subtitle')}
                        </p>
                    </div>
                    <Button
                        appearance="subtle"
                        icon={<Lightbulb />}
                        onClick={() => {
                            dataSourceStore.setShowDataImportSelection(true);
                        }}
                    >
                        {intl.get('dataSource.importData.buttonName')}
                    </Button>
                </div>

                {!hasData && (
                    <MessageBar messageBarType={MessageBarType.info} isMultiline={true}>
                        {intl.get('coach.insight.noData')}
                    </MessageBar>
                )}

                {hasData && largeDataset && commonStore.computationEngine !== 'clickhouse' && (
                    <MessageBar messageBarType={MessageBarType.warning} isMultiline={true}>
                        {intl.get('coach.insight.largeDataHint', { rows: cleanedData.length })}
                    </MessageBar>
                )}

                {hasData && !satisfyAnalysisCondition && (
                    <MessageBar messageBarType={MessageBarType.warning} isMultiline={true}>
                        {intl.get('coach.insight.noMeasure')}
                    </MessageBar>
                )}

                {hasData && (
                    <>
                        <div className="sectionTitle">{intl.get('coach.insight.recommendedNext')}</div>
                        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 10 }}>
                            <Button
                                appearance="primary"
                                disabled={!satisfyAnalysisCondition || !startMode?.onClick}
                                icon={<Play />}
                                onClick={() => startMode.onClick?.(undefined as never)}
                            >
                                {intl.get(`${startMode.key}`)}
                            </Button>
                            <span style={{ color: '#5b5b5b' }}>{describeStartMode(startMode.key as string)}</span>
                        </Stack>

                        <div className="sectionTitle">{intl.get('coach.insight.starterQuestion')}</div>
                        <div className="pillRow">
                            <span className="pill">
                                {primaryDim?.name
                                    ? intl.get('coach.insight.groupBy', { name: primaryDim.name })
                                    : intl.get('coach.insight.groupByPlaceholder')}
                            </span>
                            <span className="pill">
                                {primaryMea?.name
                                    ? intl.get('coach.insight.measure', { name: primaryMea.name })
                                    : intl.get('coach.insight.measurePlaceholder')}
                            </span>
                            <span className="pill">{intl.get('coach.insight.aggregation')}</span>
                        </div>

                        <div className="sectionTitle">{intl.get('coach.insight.whyInteresting')}</div>
                        {explainLoading && (
                            <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
                                <Spinner label={intl.get('coach.insight.generatingExplanation')} ariaLive="polite" labelPosition="right" />
                            </Stack>
                        )}
                        {!explainLoading && explains.length === 0 && (
                            <MessageBar messageBarType={MessageBarType.severeWarning} isMultiline={true}>
                                {intl.get('coach.insight.noNarrative')}
                            </MessageBar>
                        )}
                        {explains.length > 0 && (
                            <ul className="explainList">
                                {explains.map((e, idx) => (
                                    <li key={`${e.type}-${idx}`}>
                                        {e.explain}
                                    </li>
                                ))}
                            </ul>
                        )}

                        <div className="sectionTitle">{intl.get('coach.insight.quickActions')}</div>
                        <div className="actionsRow">
                            {analysisOptions.items.slice(0, 4).map((item) => (
                                <Button
                                    key={item.key}
                                    appearance="secondary"
                                    icon={
                                        item.key === 'function.analysis.start' ? <Wand2 /> :
                                        item.key === 'function.analysis.pattern' ? <Workflow /> :
                                        <Sparkles />
                                    }
                                    disabled={!satisfyAnalysisCondition && item.key === 'function.analysis.start'}
                                    onClick={() => item.onClick?.(undefined as never)}
                                >
                                    {item.text}
                                </Button>
                            ))}
                            <Button
                                appearance="secondary"
                                icon={<Wand2 />}
                                disabled={!satisfyAnalysisCondition}
                                onClick={() => commonStore.setAppKey(PIVOT_KEYS.megaAuto)}
                            >
                                {intl.get('menu.megaAuto')}
                            </Button>
                            <Button
                                appearance="secondary"
                                icon={<Waypoints />}
                                disabled={!hasData}
                                onClick={() => commonStore.setAppKey(PIVOT_KEYS.causal)}
                            >
                                {intl.get('menu.causal')}
                            </Button>
                        </div>
                    </>
                )}
            </CoachLayout>
        </Card>
    );
};

export default observer(InsightCoach);

