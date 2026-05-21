import { useMemo, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import { MessageBar, MessageBarType, Spinner, Stack, TextField } from '@fluentui/react';
import { Button } from '@fluentui/react-components';
import { Bot, Play, Sparkles } from 'lucide-react';
import { useGlobalStore } from '../../store';
import { Card } from '../../components/card';
import { getInsightExpl } from '../../services/insights';
import { askAssistantGateway, isAssistantGatewayConfigured } from '../../services/assistantGateway';
import {
    executeAssistantIntent,
    parseDataQuestion,
    persistAssistantWorkflow,
    pickNarrativeFields,
} from '../../utils/dataAssistant';
import { buildShareableWorkflowUrl, createWorkflowSnapshot } from '../../utils/workflowSession';

const Layout = styled.div`
    display: grid;
    gap: 10px;

    .title {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 1.05em;
        font-weight: 600;
    }

    .subtitle {
        color: #5b5b5b;
        line-height: 1.35;
        margin: 0;
    }
`;

const DataAssistant: React.FC = () => {
    const { commonStore, dataSourceStore, workflowStore, megaAutoStore, causalStore, langStore } = useGlobalStore();
    const [question, setQuestion] = useState('');
    const [lastReply, setLastReply] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const narrativeRequestId = useRef(0);

    const hasData = dataSourceStore.rawDataMetaInfo.length > 0;
    const gatewayEnabled = isAssistantGatewayConfigured();
    const suggestions = useMemo(
        () => [
            intl.get('assistant.suggestions.autopilot'),
            intl.get('assistant.suggestions.causal'),
            intl.get('assistant.suggestions.explain'),
        ],
        [],
    );

    const stores = useMemo(
        () => ({ commonStore, megaAutoStore, causalStore, workflowStore }),
        [commonStore, megaAutoStore, causalStore, workflowStore],
    );

    const runQuestion = async () => {
        if (!hasData) {
            setLastReply(intl.get('assistant.noData'));
            return;
        }

        setLoading(true);
        setLastReply('');

        try {
            const gateway = await askAssistantGateway({
                question,
                fields: dataSourceStore.fieldMetas,
                rowCount: dataSourceStore.cleanedData.length,
                appKey: commonStore.appKey,
                locale: langStore.lang ?? 'en-US',
            });

            const intent = gateway?.intent ?? parseDataQuestion(question, dataSourceStore.fieldMetas);

            if (gateway?.answer) {
                setLastReply(gateway.answer);
            }

            const navigated = executeAssistantIntent(intent, stores);

            if (navigated) {
                setLastReply((prev) => prev || intl.get('assistant.reply.navigate', {
                    page: intl.get(`menu.${navigated}`),
                }));
                return;
            }

            switch (intent.type) {
                case 'run_autopilot':
                    setLastReply(intl.get('assistant.reply.autopilot'));
                    break;
                case 'run_causal':
                    setLastReply(intl.get('assistant.reply.causal'));
                    break;
                case 'focus_fields': {
                    const names = intent.fieldFids
                        .map((fid) => dataSourceStore.fieldMetas.find((f) => f.fid === fid)?.name ?? fid)
                        .join(', ');
                    setLastReply(intl.get('assistant.reply.fields', { names }));
                    break;
                }
                case 'explain_fields': {
                    const narrativeFields = pickNarrativeFields(intent.fieldFids, dataSourceStore.fieldMetas);
                    if (narrativeFields.length < 2) {
                        setLastReply(intl.get('assistant.reply.needFieldsForExplain'));
                        break;
                    }
                    const sampled = dataSourceStore.cleanedData.slice(0, 800);
                    const explanations: string[] = [];
                    await new Promise<void>((resolve) => {
                        getInsightExpl({
                            requestId: narrativeRequestId,
                            dataSource: sampled,
                            fields: narrativeFields,
                            aggrType: 'mean',
                            langType: langStore.lang ?? 'en-US',
                            setExplainLoading: () => undefined,
                            resolveInsight: (rows) => {
                                if (Array.isArray(rows) && rows.length > 0) {
                                    const top = Object.keys(rows[0])
                                        .filter((k) => rows[0]?.[k]?.score > 0)
                                        .map((k) => rows[0][k]?.para?.explain ?? '')
                                        .filter(Boolean)
                                        .slice(0, 2);
                                    explanations.push(...top);
                                }
                                resolve();
                            },
                        });
                    });
                    setLastReply(
                        explanations.length > 0
                            ? explanations.join('\n\n')
                            : intl.get('assistant.reply.noNarrative'),
                    );
                    break;
                }
                case 'unknown':
                    setLastReply(intl.get('assistant.reply.unknown', {
                        suggestions: intent.suggestions.join(' · '),
                    }));
                    break;
                default:
                    setLastReply(intl.get('assistant.reply.unknown', { suggestions: suggestions.join(' · ') }));
            }
        } finally {
            setLoading(false);
        }
    };

    const copyShareLink = async () => {
        const snapshot = createWorkflowSnapshot({
            appKey: commonStore.appKey,
            autopilotHandoff: workflowStore.autopilotHandoff,
            causalHandoff: workflowStore.causalHandoff,
            effectEstimate: workflowStore.effectEstimate,
        });
        persistAssistantWorkflow(stores);
        const url = buildShareableWorkflowUrl(snapshot);
        try {
            await navigator.clipboard.writeText(url);
            setLastReply(intl.get('assistant.reply.linkCopied'));
        } catch {
            setLastReply(url);
        }
    };

    return (
        <Card backgroundColor="#ffffff">
            <Layout>
                <div className="title">
                    <Bot size={18} />
                    <span>{intl.get('assistant.title')}</span>
                </div>
                <p className="subtitle">{intl.get('assistant.subtitle')}</p>

                {gatewayEnabled && (
                    <MessageBar messageBarType={MessageBarType.info} isMultiline>
                        {intl.get('assistant.gatewayEnabled')}
                    </MessageBar>
                )}

                {!hasData && (
                    <MessageBar messageBarType={MessageBarType.info} isMultiline>
                        {intl.get('assistant.noData')}
                    </MessageBar>
                )}

                <TextField
                    multiline
                    rows={2}
                    value={question}
                    onChange={(_, value) => setQuestion(value ?? '')}
                    placeholder={intl.get('assistant.placeholder')}
                    onKeyDown={(ev) => {
                        if (ev.key === 'Enter' && !ev.shiftKey) {
                            ev.preventDefault();
                            void runQuestion();
                        }
                    }}
                />

                <Stack horizontal wrap tokens={{ childrenGap: 8 }} verticalAlign="center">
                    <Button appearance="primary" icon={<Play />} disabled={!question.trim() || loading} onClick={() => void runQuestion()}>
                        {intl.get('assistant.ask')}
                    </Button>
                    <Button appearance="secondary" icon={<Sparkles />} onClick={() => void copyShareLink()}>
                        {intl.get('assistant.copyLink')}
                    </Button>
                    {loading && <Spinner label={intl.get('assistant.thinking')} ariaLive="polite" labelPosition="right" />}
                </Stack>

                <Stack horizontal wrap tokens={{ childrenGap: 8 }}>
                    {suggestions.map((s) => (
                        <Button key={s} appearance="subtle" onClick={() => setQuestion(s)}>
                            {s}
                        </Button>
                    ))}
                </Stack>

                {lastReply && (
                    <MessageBar messageBarType={MessageBarType.success} isMultiline>
                        {lastReply}
                    </MessageBar>
                )}
            </Layout>
        </Card>
    );
};

export default observer(DataAssistant);
