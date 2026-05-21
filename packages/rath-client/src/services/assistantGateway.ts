import type { IFieldMeta } from '../interfaces';
import type { AssistantIntent } from '../utils/dataAssistant';
import { getTestServerAPI } from './base';

export type AssistantGatewayContext = {
    question: string;
    fields: readonly IFieldMeta[];
    rowCount: number;
    appKey: string;
    locale: string;
};

export type AssistantGatewayResponse = {
    answer?: string;
    intent?: AssistantIntent;
};

function getAssistantEndpoint(): string {
    if (typeof window === 'undefined') return '';
    const fromQuery = new URL(window.location.href).searchParams.get('llmServer');
    if (fromQuery) {
        return `${decodeURIComponent(fromQuery).replace(/\/$/, '')}/assistant`;
    }
    return getTestServerAPI('assistant');
}

export function isAssistantGatewayConfigured(): boolean {
    return typeof window !== 'undefined';
}

export async function askAssistantGateway(
    context: AssistantGatewayContext,
): Promise<AssistantGatewayResponse | null> {
    const endpoint = getAssistantEndpoint();
    if (!endpoint) {
        return null;
    }

    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                question: context.question,
                fields: context.fields.map((f) => ({
                    fid: f.fid,
                    name: f.name,
                    semanticType: f.semanticType,
                    analyticType: f.analyticType,
                })),
                rowCount: context.rowCount,
                appKey: context.appKey,
                locale: context.locale,
            }),
        });
        if (!res.ok) {
            return null;
        }
        const text = await res.text();
        const json = JSON.parse(text) as {
            success?: boolean;
            data?: AssistantGatewayResponse;
            answer?: string;
            intent?: AssistantIntent;
        };
        if (json.success === false) {
            return null;
        }
        if (json.data) {
            return json.data;
        }
        if (json.answer || json.intent) {
            return { answer: json.answer, intent: json.intent };
        }
        return null;
    } catch {
        return null;
    }
}
