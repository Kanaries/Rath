import { MessageBar, MessageBarType, Spinner, Stack } from '@fluentui/react';
import { Button } from '@fluentui/react-components';
import { observer } from 'mobx-react-lite';
import { useMemo, useState } from 'react';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import { FlaskConical, LayoutDashboard } from 'lucide-react';
import { useGlobalStore } from '../../store';
import { notify } from '../../components/error';
import { estimateCausalEffect, type CausalEffectEstimateResult } from '../../services/causal-effect';
import { pickEffectEstimationPlan } from '../../utils/causalEffect';
import { addDashboardTextCard } from '../../store/workflowStore';

const Panel = styled.div`
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #e9ebf0;
`;

const Title = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 600;
    margin-bottom: 6px;
`;

const Meta = styled.div`
    color: #5b5b5b;
    line-height: 1.35;
    margin-bottom: 8px;
    font-size: 13px;
`;

const ResultBox = styled.pre`
    white-space: pre-wrap;
    margin: 8px 0 0 0;
    padding: 10px;
    border-radius: 8px;
    background: #f5f7fa;
    border: 1px solid #e9ebf0;
    color: #2e2e2e;
    font-size: 12px;
    line-height: 1.4;
`;

const EFFECT_ESTIMATION_ROW_LIMIT = 10_000;

function fieldLabel(fields: readonly { fid: string; name?: string }[], fid: string): string {
    return fields.find((f) => f.fid === fid)?.name ?? fid;
}

const EffectEstimationPanel: React.FC = () => {
    const { causalStore, dashboardStore, commonStore, workflowStore } = useGlobalStore();
    const { fields, sample } = causalStore.dataset;
    const { mergedPag, functionalDependencies } = causalStore.model;
    const autopilotHandoff = workflowStore.autopilotHandoff;

    const plan = useMemo(
        () => pickEffectEstimationPlan(mergedPag ?? [], fields, autopilotHandoff),
        [mergedPag, fields, autopilotHandoff],
    );

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<CausalEffectEstimateResult | null>(null);

    const planDescription = useMemo(() => {
        if (!plan) return intl.get('coach.effect.noPlan');
        return intl.get('coach.effect.plan', {
            target: fieldLabel(fields, plan.targetFid),
            treatments: plan.treatmentFids.map((fid) => fieldLabel(fields, fid)).join(', '),
        });
    }, [plan, fields]);

    const runEstimate = async () => {
        if (!plan || !mergedPag) return;
        const { sampleSize, fullDataSize } = causalStore.dataset;
        const rowCount = sampleSize || fullDataSize;
        if (rowCount > EFFECT_ESTIMATION_ROW_LIMIT) {
            notify({
                type: 'warning',
                title: intl.get('coach.effect.errorTitle'),
                content: intl.get('coach.effect.tooManyRows', {
                    rows: rowCount,
                    limit: EFFECT_ESTIMATION_ROW_LIMIT,
                }),
            });
            return;
        }
        setLoading(true);
        setResult(null);
        try {
            const dataSource = await sample.getAll();
            const estimate = await estimateCausalEffect({
                dataSource,
                allFields: causalStore.dataset.allFields,
                focusedFields: fields,
                targetFid: plan.targetFid,
                treatmentFids: plan.treatmentFids,
                pag: mergedPag,
                functionalDependencies,
            });
            setResult(estimate);
            workflowStore.setEffectEstimate({
                targetFid: estimate.targetFid,
                treatmentFids: [...estimate.treatmentFids],
                method: estimate.method,
                value: estimate.value,
                summary: estimate.summary,
            });
        } catch (error) {
            notify({
                type: 'error',
                title: intl.get('coach.effect.errorTitle'),
                content: error instanceof Error ? error.message : String(error),
            });
        } finally {
            setLoading(false);
        }
    };

    const saveToDashboard = () => {
        if (!result) return;
        const target = fieldLabel(fields, result.targetFid);
        const treatments = result.treatmentFids.map((fid) => fieldLabel(fields, fid)).join(', ');
        const title = intl.get('coach.effect.dashboardTitle', { target });
        const valueLine = typeof result.value === 'number' && Number.isFinite(result.value)
            ? intl.get('coach.effect.dashboardValue', { value: result.value.toPrecision(4), method: result.method })
            : '';
        const text = [
            intl.get('coach.effect.dashboardText', { target, treatments, method: result.method }),
            valueLine,
            result.summary,
        ].filter(Boolean).join('\n\n');
        addDashboardTextCard(dashboardStore, commonStore, { title, text });
    };

    if (!mergedPag || mergedPag.length === 0) {
        return null;
    }

    return (
        <Panel>
            <Title>
                <FlaskConical size={18} />
                <span>{intl.get('coach.effect.title')}</span>
            </Title>
            <Meta>{intl.get('coach.effect.subtitle')}</Meta>
            <Meta>{planDescription}</Meta>

            {!plan && (
                <MessageBar messageBarType={MessageBarType.warning} isMultiline>
                    {intl.get('coach.effect.needTreatments')}
                </MessageBar>
            )}

            {plan && (
                <Stack tokens={{ childrenGap: 8 }}>
                    <Stack horizontal tokens={{ childrenGap: 8 }} wrap>
                        <Button
                            appearance="primary"
                            disabled={loading || causalStore.operator.busy}
                            onClick={runEstimate}
                        >
                            {intl.get('coach.effect.run')}
                        </Button>
                        {result && (
                            <Button appearance="secondary" icon={<LayoutDashboard />} onClick={saveToDashboard}>
                                {intl.get('coach.effect.saveToDashboard')}
                            </Button>
                        )}
                    </Stack>
                    {loading && <Spinner label={intl.get('coach.effect.running')} />}
                    {result && (
                        <>
                            {typeof result.value === 'number' && Number.isFinite(result.value) && (
                                <MessageBar messageBarType={MessageBarType.success} isMultiline>
                                    {intl.get('coach.effect.resultValue', {
                                        target: fieldLabel(fields, result.targetFid),
                                        value: result.value.toPrecision(4),
                                        method: result.method,
                                    })}
                                </MessageBar>
                            )}
                            <ResultBox>{result.summary || result.rawEstimate}</ResultBox>
                        </>
                    )}
                </Stack>
            )}
        </Panel>
    );
};

export default observer(EffectEstimationPanel);
