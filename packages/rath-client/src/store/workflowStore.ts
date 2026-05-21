import { makeAutoObservable } from 'mobx';
import { toJS } from 'mobx';
import intl from 'react-intl-universal';
import { PIVOT_KEYS } from '../constants';
import type { IVegaSubset } from '../interfaces';
import type { CommonStore } from './commonStore';
import type DashboardStore from './dashboardStore';

export interface AutopilotHandoff {
    dimensions: readonly string[];
    measures: readonly string[];
    score?: number;
    title: string;
}

export interface CausalHandoff {
    algorithm: string;
    fieldNames: readonly string[];
    edgeCount: number;
    linkedFromAutopilot: boolean;
    autopilotTitle?: string;
}

export interface EffectEstimateHandoff {
    targetFid: string;
    treatmentFids: readonly string[];
    method: string;
    value?: number;
    summary: string;
}

export class WorkflowStore {
    public autopilotHandoff: AutopilotHandoff | null = null;
    public causalHandoff: CausalHandoff | null = null;
    public effectEstimate: EffectEstimateHandoff | null = null;

    constructor() {
        makeAutoObservable(this);
    }

    public setAutopilotHandoff(handoff: AutopilotHandoff | null) {
        this.autopilotHandoff = handoff;
    }

    public setCausalHandoff(handoff: CausalHandoff | null) {
        this.causalHandoff = handoff;
    }

    public clearAutopilotHandoff() {
        this.autopilotHandoff = null;
    }

    public clearCausalHandoff() {
        this.causalHandoff = null;
    }

    public setEffectEstimate(handoff: EffectEstimateHandoff | null) {
        this.effectEstimate = handoff;
    }

    public clearEffectEstimate() {
        this.effectEstimate = null;
    }
}

type DashboardCardContent = {
    title: string;
    text: string;
    chart?: {
        subset: IVegaSubset;
        filters: [];
        selectors: [];
        highlighter: [];
        size: { w: number; h: number };
    };
};

export function addDashboardTextCard(
    dashboardStore: DashboardStore,
    commonStore: CommonStore,
    content: DashboardCardContent,
    navigate = true,
) {
    if (dashboardStore.pages.length === 0) {
        dashboardStore.newPage();
    }
    const pageIndex = Math.max(0, dashboardStore.pages.length - 1);
    const page = dashboardStore.pages[pageIndex];
    const { data, operators } = dashboardStore.fromPage(pageIndex);
    const cardIdx = operators.addCard({ x: 0, y: 0, w: 6, h: content.chart ? 4 : 2 }) - 1;

    dashboardStore.runInAction(() => {
        page.info.name = content.title;
        page.info.lastModifyTime = Date.now();
        const card = data.cards[cardIdx];
        card.content.title = content.title;
        card.content.text = content.text;
        if (content.chart) {
            card.content.chart = content.chart;
        }
        operators.fireUpdate();
    });

    if (navigate) {
        commonStore.setAppKey(PIVOT_KEYS.dashboard);
    }
}

export function saveAutopilotInsightToDashboard(
    dashboardStore: DashboardStore,
    commonStore: CommonStore,
    params: {
        title: string;
        desc: string;
        spec: IVegaSubset;
    },
) {
    addDashboardTextCard(dashboardStore, commonStore, {
        title: params.title,
        text: params.desc,
        chart: {
            subset: toJS(params.spec),
            filters: [],
            selectors: [],
            highlighter: [],
            size: { w: 1, h: 1 },
        },
    });
}

export function saveCausalSummaryToDashboard(
    dashboardStore: DashboardStore,
    commonStore: CommonStore,
    handoff: CausalHandoff,
) {
    const fields = handoff.fieldNames.join(', ');
    const title = intl.get('coach.causal.summaryTitle', {
        algo: handoff.algorithm,
        edges: handoff.edgeCount,
    });
    const text = intl.get('coach.causal.summaryText', {
        fields,
        edges: handoff.edgeCount,
        algo: handoff.algorithm,
    });
    addDashboardTextCard(dashboardStore, commonStore, { title, text });
}

export function countCausalEdges(causality: readonly unknown[] | null | undefined): number {
    return causality?.length ?? 0;
}
