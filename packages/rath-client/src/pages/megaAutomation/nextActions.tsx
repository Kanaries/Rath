import { MessageBar, MessageBarType, Stack } from '@fluentui/react';
import { Button } from '@fluentui/react-components';
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';
import { toJS } from 'mobx';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import { BookOpen, LayoutDashboard, Link2, MoveRight, Sparkles, Waypoints } from 'lucide-react';
import { useGlobalStore } from '../../store';
import { Card } from '../../components/card';
import { PIVOT_KEYS } from '../../constants';
import type { IFieldMeta } from '../../interfaces';
import { saveAutopilotInsightToDashboard } from '../../store/workflowStore';
import { buildShareableWorkflowUrl, createWorkflowSnapshot, saveWorkflowSession } from '../../utils/workflowSession';

const Row = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
`;

function formatInsightTitle(fieldsById: Map<string, IFieldMeta>, dims: readonly string[], meas: readonly string[]) {
    const dn = dims.map((fid) => fieldsById.get(fid)?.name ?? fid).filter(Boolean);
    const mn = meas.map((fid) => fieldsById.get(fid)?.name ?? fid).filter(Boolean);
    if (dn.length === 0 && mn.length === 0) return intl.get('coach.nextActions.defaultTitle');
    if (dn.length === 0) return intl.get('coach.nextActions.titleMeasOnly', { meas: mn.join(', ') });
    if (mn.length === 0) return intl.get('coach.nextActions.titleDimsOnly', { dims: dn.join(', ') });
    return intl.get('coach.nextActions.titleBoth', { dims: dn.join(', '), meas: mn.join(', ') });
}

function pickCausalIndices(allFields: readonly IFieldMeta[], fids: readonly string[], limit = 12): number[] {
    const fidSet = new Set(fids);
    const direct = allFields
        .map((f, idx) => ({ f, idx }))
        .filter(({ f }) => fidSet.has(f.fid) && f.fid !== '__index__')
        .map(({ idx }) => idx);
    if (direct.length > 0) return direct.slice(0, limit);
    return allFields
        .map((f, idx) => ({ f, idx }))
        .filter(({ f }) => f.fid !== '__index__')
        .sort((a, b) => {
            const score = (x: IFieldMeta) =>
                x.semanticType === 'quantitative' || x.semanticType === 'ordinal' ? 0 : 1;
            return score(a.f) - score(b.f);
        })
        .slice(0, Math.min(limit, allFields.length))
        .map(({ idx }) => idx);
}

const NextActions: React.FC = () => {
    const { megaAutoStore, commonStore, causalStore, dashboardStore, workflowStore } = useGlobalStore();

    const { insightSpaces, pageIndex, mainView, fieldMetas } = megaAutoStore;
    const current = insightSpaces[pageIndex] ?? null;

    const fieldsById = useMemo(() => new Map(fieldMetas.map((f) => [f.fid, f])), [fieldMetas]);
    const currentFids = useMemo(() => {
        if (!current) return [];
        return [...current.dimensions, ...current.measures];
    }, [current]);

    const title = useMemo(() => {
        if (!current) return intl.get('coach.nextActions.title');
        return formatInsightTitle(fieldsById, current.dimensions, current.measures);
    }, [current, fieldsById]);

    const desc = useMemo(() => {
        if (!current) return intl.get('coach.nextActions.emptyDesc');
        if (typeof current.score === 'number') {
            return intl.get('coach.nextActions.scoreDesc', { score: (current.score * 100).toFixed(0) });
        }
        return intl.get('coach.nextActions.emptyDesc');
    }, [current]);

    const canUseView = Boolean(current && mainView.spec);

    const rememberAutopilotHandoff = () => {
        if (!current) return;
        workflowStore.setAutopilotHandoff({
            dimensions: [...current.dimensions],
            measures: [...current.measures],
            score: current.score,
            title,
        });
    };

    const saveToDashboard = () => {
        if (!mainView.spec || !current) return;
        rememberAutopilotHandoff();
        saveAutopilotInsightToDashboard(dashboardStore, commonStore, {
            title,
            desc,
            spec: toJS(mainView.spec),
        });
    };

    const explainThis = () => {
        rememberAutopilotHandoff();
        megaAutoStore.setVisualConig((cfg) => {
            cfg.nlg = true;
        });
    };

    const tryCausal = () => {
        rememberAutopilotHandoff();
        const fids = currentFids;
        if (causalStore.dataset.allFields.length > 0) {
            const indices = pickCausalIndices(causalStore.dataset.allFields as IFieldMeta[], fids);
            causalStore.dataset.selectFields(indices);
        }
        const available = Object.keys(causalStore.operator.causalAlgorithmForm ?? {});
        if (available.includes('PC')) {
            causalStore.operator.algorithm = 'PC';
        }
        commonStore.setAppKey(PIVOT_KEYS.causal);
    };

    const openManual = () => {
        if (!mainView.spec) return;
        rememberAutopilotHandoff();
        commonStore.visualAnalysisInGraphicWalker(toJS(mainView.spec));
        commonStore.setAppKey(PIVOT_KEYS.editor);
    };

    const copyShareLink = async () => {
        rememberAutopilotHandoff();
        const snapshot = createWorkflowSnapshot({
            appKey: PIVOT_KEYS.megaAuto,
            autopilotHandoff: workflowStore.autopilotHandoff,
            causalHandoff: workflowStore.causalHandoff,
            effectEstimate: workflowStore.effectEstimate,
        });
        saveWorkflowSession(snapshot);
        const url = buildShareableWorkflowUrl(snapshot);
        try {
            await navigator.clipboard.writeText(url);
        } catch {
            // Clipboard unavailable; fall back to opening the URL in a new tab context via prompt-less copy failure.
        }
    };

    return (
        <Card backgroundColor="#ffffff">
            <div style={{ fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
                <MoveRight size={18} />
                <span>{intl.get('coach.nextActions.title')}</span>
            </div>
            <div style={{ color: '#5b5b5b', marginBottom: 10, lineHeight: 1.35 }}>
                <b>{title}</b> — {desc}
            </div>

            {!current && (
                <MessageBar messageBarType={MessageBarType.info} isMultiline>
                    {intl.get('coach.nextActions.noInsights')}
                </MessageBar>
            )}

            {current && (
                <Stack tokens={{ childrenGap: 10 }}>
                    <Row>
                        <Button appearance="primary" icon={<LayoutDashboard />} disabled={!canUseView} onClick={saveToDashboard}>
                            {intl.get('coach.nextActions.saveToDashboard')}
                        </Button>
                        <Button appearance="secondary" icon={<BookOpen />} disabled={!current} onClick={explainThis}>
                            {intl.get('coach.nextActions.explain')}
                        </Button>
                        <Button appearance="secondary" icon={<Waypoints />} disabled={!current} onClick={tryCausal}>
                            {intl.get('coach.nextActions.tryCausal')}
                        </Button>
                        <Button appearance="secondary" icon={<Sparkles />} disabled={!canUseView} onClick={openManual}>
                            {intl.get('coach.nextActions.openManual')}
                        </Button>
                        <Button appearance="secondary" icon={<Link2 />} disabled={!current} onClick={() => void copyShareLink()}>
                            {intl.get('coach.nextActions.copyLink')}
                        </Button>
                    </Row>
                    <div style={{ color: '#5b5b5b', fontSize: 12 }}>
                        {intl.get('coach.nextActions.tip')}
                    </div>
                </Stack>
            )}
        </Card>
    );
};

export default observer(NextActions);
