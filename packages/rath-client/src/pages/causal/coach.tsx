import { Stack, MessageBar, MessageBarType } from '@fluentui/react';
import { Button } from '@fluentui/react-components';
import { observer } from 'mobx-react-lite';
import { useEffect, useMemo } from 'react';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import { LayoutDashboard, Play, Settings, Target, Waypoints, Zap } from 'lucide-react';
import { Card } from '../../components/card';
import { useGlobalStore } from '../../store';
import { PIVOT_KEYS } from '../../constants';
import { useCausalViewContext } from '../../store/causalStore/viewStore';
import type { IFieldMeta } from '../../interfaces';
import { countCausalEdges, saveCausalSummaryToDashboard } from '../../store/workflowStore';

const Title = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 600;
    margin-bottom: 6px;
`;

const Sub = styled.div`
    color: #5b5b5b;
    line-height: 1.35;
    margin-bottom: 10px;
`;

const Row = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
`;

function pickRecommendedFieldIndices(allFields: readonly IFieldMeta[], limit = 10): number[] {
    const safe = allFields.filter((f) => f.fid !== '__index__');
    const numeric = safe.filter((f) => f.semanticType === 'quantitative' || f.semanticType === 'ordinal');
    const fallback = safe;
    const picked = (numeric.length >= 4 ? numeric : fallback).slice(0, Math.min(Math.max(4, limit), safe.length));
    return picked.map((f) => allFields.findIndex((x) => x.fid === f.fid)).filter((i) => i >= 0);
}

const CausalCoach = () => {
    const { causalStore, dashboardStore, commonStore, workflowStore } = useGlobalStore();
    const viewContext = useCausalViewContext();

    const { dataset, model, operator } = causalStore;
    const { allFields, fields } = dataset;

    const algoName = operator.algorithm;
    const algoForm = useMemo(() => {
        if (!algoName) return null;
        return operator.causalAlgorithmForm?.[algoName] ?? null;
    }, [operator.causalAlgorithmForm, algoName]);

    const hasMutual = Boolean(model.mutualMatrix && model.mutualMatrix.length > 0);
    const hasCausal = Boolean(model.causality && model.causality.length > 0);
    const edgeCount = useMemo(() => countCausalEdges(model.causality), [model.causality]);

    const recommendedAlgo = useMemo(() => {
        const available = Object.keys(operator.causalAlgorithmForm ?? {});
        if (available.includes('PC')) return 'PC';
        return available.at(0) ?? null;
    }, [operator.causalAlgorithmForm]);

    const recommendedFieldIndices = useMemo(() => {
        return pickRecommendedFieldIndices(allFields, 10);
    }, [allFields]);

    const autopilotHandoff = workflowStore.autopilotHandoff;

    useEffect(() => {
        if (!hasCausal || !algoName) return;
        workflowStore.setCausalHandoff({
            algorithm: algoName,
            fieldNames: fields.map((f) => f.name || f.fid),
            edgeCount,
            linkedFromAutopilot: Boolean(autopilotHandoff),
            autopilotTitle: autopilotHandoff?.title,
        });
    }, [hasCausal, algoName, fields, edgeCount, autopilotHandoff]);

    const saveSummaryToDashboard = () => {
        const handoff = workflowStore.causalHandoff;
        if (!handoff) return;
        saveCausalSummaryToDashboard(dashboardStore, commonStore, handoff);
    };

    return (
        <Card backgroundColor="#ffffff">
            <Title>
                <Target size={18} />
                <span>{intl.get('coach.causal.title')}</span>
            </Title>
            <Sub>{intl.get('coach.causal.subtitle')}</Sub>

            {autopilotHandoff && (
                <MessageBar messageBarType={MessageBarType.success} isMultiline style={{ marginBottom: 10 }}>
                    {intl.get('coach.causal.fromAutopilot', { title: autopilotHandoff.title })}
                </MessageBar>
            )}

            {allFields.length === 0 && (
                <MessageBar messageBarType={MessageBarType.info} isMultiline>
                    {intl.get('coach.causal.noData')}
                </MessageBar>
            )}

            {allFields.length > 0 && (
                <>
                    <div style={{ color: '#2e2e2e', marginBottom: 8 }}>
                        <b>
                            {intl.get('coach.causal.selectedFields', {
                                selected: fields.length,
                                total: allFields.length,
                            })}
                        </b>
                    </div>
                    <Row>
                        <Button
                            appearance="secondary"
                            icon={<Zap />}
                            onClick={() => {
                                dataset.selectFields(recommendedFieldIndices);
                            }}
                        >
                            {intl.get('coach.causal.useRecommendedFields')}
                        </Button>
                        {recommendedAlgo && algoName !== recommendedAlgo && (
                            <Button
                                appearance="secondary"
                                icon={<Zap />}
                                onClick={() => {
                                    operator.algorithm = recommendedAlgo;
                                }}
                            >
                                {intl.get('coach.causal.useAlgorithm', { algo: recommendedAlgo })}
                            </Button>
                        )}
                        <Button
                            appearance="secondary"
                            icon={<Settings />}
                            onClick={() => viewContext?.openAlgorithmPanel()}
                        >
                            {intl.get('coach.causal.algorithmSettings')}
                        </Button>
                    </Row>

                    <Stack tokens={{ childrenGap: 8 }} style={{ marginTop: 10 }}>
                        <MessageBar messageBarType={MessageBarType.info} isMultiline>
                            <b>{intl.get('coach.causal.nextStep')}</b>{' '}
                            {!hasMutual && !hasCausal
                                ? intl.get('coach.causal.nextComputeMutual')
                                : hasMutual && !hasCausal
                                  ? intl.get('coach.causal.nextRunDiscovery')
                                  : intl.get('coach.causal.nextExploreGraph')}
                        </MessageBar>
                        <Row>
                            <Button
                                appearance="primary"
                                icon={<Play />}
                                disabled={operator.busy || fields.length === 0}
                                onClick={() => {
                                    if (!hasMutual) {
                                        causalStore.computeMutualMatrix();
                                    } else {
                                        causalStore.run();
                                    }
                                }}
                            >
                                {!hasMutual ? intl.get('coach.causal.computeMutual') : intl.get('coach.causal.runDiscovery')}
                            </Button>
                            <Button
                                appearance="secondary"
                                disabled={operator.busy || fields.length === 0}
                                onClick={() => causalStore.run()}
                            >
                                {intl.get('coach.causal.runAlways')}
                            </Button>
                            {hasCausal && (
                                <Button
                                    appearance="secondary"
                                    icon={<LayoutDashboard />}
                                    onClick={saveSummaryToDashboard}
                                >
                                    {intl.get('coach.causal.saveSummary')}
                                </Button>
                            )}
                            {autopilotHandoff && (
                                <Button
                                    appearance="secondary"
                                    icon={<Waypoints />}
                                    onClick={() => commonStore.setAppKey(PIVOT_KEYS.megaAuto)}
                                >
                                    {intl.get('coach.causal.backToAutopilot')}
                                </Button>
                            )}
                            {(workflowStore.causalHandoff || workflowStore.effectEstimate) && (
                                <Button
                                    appearance="secondary"
                                    icon={<LayoutDashboard />}
                                    onClick={() => commonStore.setAppKey(PIVOT_KEYS.dashboard)}
                                >
                                    {intl.get('coach.causal.openDashboard')}
                                </Button>
                            )}
                        </Row>
                    </Stack>

                    <div style={{ marginTop: 12 }}>
                        <div style={{ fontWeight: 600, marginBottom: 6 }}>{intl.get('coach.causal.whatRunning')}</div>
                        <div style={{ color: '#2e2e2e' }}>
                            <b>{intl.get('coach.causal.algorithm')}</b> {algoName ?? intl.get('coach.causal.algorithmNone')}
                            {algoForm?.title ? ` — ${algoForm.title}` : ''}
                        </div>
                        {algoForm?.description && (
                            <pre style={{ whiteSpace: 'pre-wrap', margin: '8px 0 0 0', color: '#5b5b5b' }}>
                                {algoForm.description}
                            </pre>
                        )}
                    </div>
                </>
            )}
        </Card>
    );
};

export default observer(CausalCoach);
