import intl from 'react-intl-universal';
import { Link, MessageBar, MessageBarType } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import { useGlobalStore } from '../../store';
import { PIVOT_KEYS } from '../../constants';

const effectValueFormatter = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 4,
});

function formatEffectValue(value: unknown): string {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return '—';
    }
    return effectValueFormatter.format(value);
}

const DashboardWorkflowBanner: React.FC = () => {
    const { workflowStore, commonStore } = useGlobalStore();
    const { autopilotHandoff, causalHandoff, effectEstimate } = workflowStore;

    if (!autopilotHandoff && !causalHandoff && !effectEstimate) {
        return null;
    }

    const parts: string[] = [];
    if (autopilotHandoff?.title) {
        parts.push(intl.get('dashboardPage.workflow.autopilot', { title: autopilotHandoff.title }));
    }
    if (causalHandoff) {
        parts.push(intl.get('dashboardPage.workflow.causal', {
            algo: causalHandoff.algorithm,
            edges: causalHandoff.edgeCount,
        }));
    }
    if (effectEstimate) {
        parts.push(intl.get('dashboardPage.workflow.effect', {
            target: effectEstimate.targetFid,
            value: formatEffectValue(effectEstimate.value),
        }));
    }

    return (
        <MessageBar
            messageBarType={MessageBarType.info}
            isMultiline
            actions={
                autopilotHandoff ? (
                    <div>
                        <Link onClick={() => commonStore.setAppKey(PIVOT_KEYS.megaAuto)}>
                            {intl.get('dashboardPage.workflow.backToAutopilot')}
                        </Link>
                    </div>
                ) : undefined
            }
        >
            {intl.get('dashboardPage.workflow.summary', { details: parts.join(' · ') })}
        </MessageBar>
    );
};

export default observer(DashboardWorkflowBanner);
