import intl from 'react-intl-universal';
import { MessageBar, MessageBarType } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import { useGlobalStore } from '../../store';
import { PIVOT_KEYS } from '../../constants';

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
            value: typeof effectEstimate.value === 'number' ? effectEstimate.value.toPrecision(4) : '—',
        }));
    }

    return (
        <MessageBar
            messageBarType={MessageBarType.info}
            isMultiline
            actions={
                autopilotHandoff ? (
                    <div>
                        <button
                            type="button"
                            onClick={() => commonStore.setAppKey(PIVOT_KEYS.megaAuto)}
                            style={{ border: 'none', background: 'transparent', color: '#106ebe', cursor: 'pointer' }}
                        >
                            {intl.get('dashboardPage.workflow.backToAutopilot')}
                        </button>
                    </div>
                ) : undefined
            }
        >
            {intl.get('dashboardPage.workflow.summary', { details: parts.join(' · ') })}
        </MessageBar>
    );
};

export default observer(DashboardWorkflowBanner);
