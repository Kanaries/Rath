import produce from "immer";
import { makeAutoObservable, observable, reaction, runInAction } from "mobx";
import { createContext, FC, useContext, useMemo, createElement, useEffect, useCallback } from "react";
import { Subject, withLatestFrom } from "rxjs";
import type { IFieldMeta } from "../../interfaces";
import type { PagLink } from "../../pages/causal/config";
import type { IReactiveGraphHandler } from "../../pages/causal/explorer/graph-helper";
import type { GraphNodeAttributes } from "../../pages/causal/explorer/graph-utils";
import type { IPredictResult, PredictAlgorithm } from "../../pages/causal/predict";
import type { IRInsightExplainResult } from "../../workers/insight/r-insight.worker";
import type CausalStore from "./mainStore";


export enum NodeSelectionMode {
    NONE = '0',
    SINGLE = '1',
    DOUBLE = '2',
    MULTIPLE = 'n',
}

export enum ExplorationKey {
    // CAUSAL_BLAME = 'CausalBlame',
    AUTO_VIS = 'AutoVis',
    HYPOTHESIS_TEST = 'HypothesisTest',
    WHAT_IF = 'WhatIf',
    CROSS_FILTER = 'CrossFilter',
    CAUSAL_INSIGHT = 'CausalInsight',
    GRAPHIC_WALKER = 'GraphicWalker',
    PREDICT = 'predict',
}

export const ExplorationOptions = [
    // { key: ExplorationKey.CAUSAL_BLAME, text: '归因分析' },
    { key: ExplorationKey.AUTO_VIS, text: '变量概览' },
    { key: ExplorationKey.WHAT_IF, text: 'What If' },
    { key: ExplorationKey.HYPOTHESIS_TEST, text: '因果假设' },
    { key: ExplorationKey.CROSS_FILTER, text: '因果验证' },
    { key: ExplorationKey.CAUSAL_INSIGHT, text: '可解释探索' },
    { key: ExplorationKey.GRAPHIC_WALKER, text: '可视化自助分析' },
    { key: ExplorationKey.PREDICT, text: '模型预测' },
] as const;

export enum LayoutMethod {
    FORCE = 'force',
    CIRCULAR = 'circular',
    RADIAL = 'radial',
    GRID = 'grid',
}

export const LayoutMethods: readonly LayoutMethod[] = [
    LayoutMethod.FORCE, LayoutMethod.CIRCULAR, LayoutMethod.RADIAL, LayoutMethod.GRID,
];

export const getLayoutConfig = (layout: LayoutMethod) => {
    switch (layout) {
        case LayoutMethod.FORCE: {
            return {
                type: 'fruchterman',
                gravity: 5,
                speed: 10,
            };
        }
        case LayoutMethod.CIRCULAR: {
            return {
                type: 'circular',
                speed: 10,
                startRadius: 120,
                endRadius: 120,
            };
        }
        case LayoutMethod.RADIAL: {
            return {
                type: 'radial',
                speed: 10,
                linkDistance: 50,
            };
        }
        case LayoutMethod.GRID: {
            return {
                type: 'grid',
                speed: 10,
            };
        }
    }
};

type CausalViewEventListeners = {
    nodeClick: (node: Readonly<IFieldMeta>) => void;
    nodeDoubleClick: (node: Readonly<IFieldMeta>) => void;
};

class CausalViewStore {

    public explorationKey = ExplorationKey.AUTO_VIS;
    public graphNodeSelectionMode = NodeSelectionMode.MULTIPLE;

    protected selectedFidArr$ = new Subject<readonly string[]>();
    protected _selectedNodes: readonly IFieldMeta[] = [];
    public get selectedFieldGroup() {
        return this._selectedNodes.slice(0);
    }
    public get selectedField() {
        return this._selectedNodes.at(0) ?? null;
    }

    public layoutMethod: LayoutMethod = LayoutMethod.FORCE;

    public shouldDisplayAlgorithmPanel = false;

    public onRenderNode: ((node: Readonly<IFieldMeta>) => GraphNodeAttributes | undefined) | undefined;
    public localWeights: Map<string, Map<string, number>> | undefined;
    public localData: { fields: readonly IFieldMeta[]; pag: readonly PagLink[] } | null = null;
    public predictCache: {
        id: string; algo: PredictAlgorithm; startTime: number; completeTime: number; data: IPredictResult;
    }[];
    
    public readonly destroy: () => void;

    protected listeners: { [key in keyof CausalViewEventListeners]: CausalViewEventListeners[key][] } = {
        nodeClick: [],
        nodeDoubleClick: [],
    };

    public graph: IReactiveGraphHandler | null = null;

    constructor(causalStore: CausalStore) {
        this.onRenderNode = node => {
            const value = 2 / (1 + Math.exp(-1 * node.features.entropy / 2)) - 1;
            return {
                style: {
                    stroke: `rgb(${Math.floor(95 * (1 - value))},${Math.floor(149 * (1 - value))},255)`,
                },
            };
        };
        this.localWeights = undefined;
        this.predictCache = [];

        const fields$ = new Subject<readonly IFieldMeta[]>();

        makeAutoObservable(this, {
            onRenderNode: observable.ref,
            localWeights: observable.ref,
            predictCache: observable.shallow,
            localData: observable.ref,
            graph: false,
            // @ts-expect-error non-public field
            _selectedNodes: observable.ref,
            selectedFidArr$: false,
            listeners: false,
        });

        const mobxReactions = [
            reaction(() => causalStore.fields, fields => {
                fields$.next(fields);
                this.selectedFidArr$.next([]);
            }),
            reaction(() => causalStore.model.mergedPag, () => {
                this.selectedFidArr$.next([]);
            }),
            reaction(() => this.explorationKey, explorationKey => {
                runInAction(() => {
                    switch (explorationKey) {
                        // case ExplorationKey.CAUSAL_BLAME:
                        case ExplorationKey.CAUSAL_INSIGHT:
                        case ExplorationKey.PREDICT: {
                            this.graphNodeSelectionMode = NodeSelectionMode.SINGLE;
                            break;
                        }
                        case ExplorationKey.AUTO_VIS:
                        case ExplorationKey.CROSS_FILTER: {
                            this.graphNodeSelectionMode = NodeSelectionMode.MULTIPLE;
                            break;
                        }
                        case ExplorationKey.HYPOTHESIS_TEST: {
                            this.graphNodeSelectionMode = NodeSelectionMode.DOUBLE;
                            break;
                        }
                        default: {
                            this.graphNodeSelectionMode = NodeSelectionMode.NONE;
                        }
                    }
                });
            }),
            reaction(() => this.graphNodeSelectionMode, graphNodeSelectionMode => {
                runInAction(() => {
                    switch (graphNodeSelectionMode) {
                        case NodeSelectionMode.SINGLE:
                        case NodeSelectionMode.DOUBLE: {
                            this._selectedNodes = this._selectedNodes.slice(this._selectedNodes.length - 1);
                            break;
                        }
                        case NodeSelectionMode.MULTIPLE: {
                            break;
                        }
                        default: {
                            this._selectedNodes = [];
                            break;
                        }
                    }
                });
            }),
        ];

        const rxReactions = [
            this.selectedFidArr$.subscribe(() => {
                this.localWeights = undefined;
            }),
            this.selectedFidArr$.pipe(
                withLatestFrom(fields$)
            ).subscribe(([fidArr, fields]) => {
                runInAction(() => {
                    this._selectedNodes = fidArr.reduce<IFieldMeta[]>((nodes, fid) => {
                        const f = fields.find(which => which.fid === fid);
                        if (f) {
                            return nodes.concat([f]);
                        } else {
                            console.warn(`Select node warning: cannot find field ${fid}.`, fields);
                        }
                        return nodes;
                    }, []);
                });
            }),
        ];

        fields$.next(causalStore.fields);

        this.destroy = () => {
            mobxReactions.forEach(dispose => dispose());
            rxReactions.forEach(subscription => subscription.unsubscribe());
            for (const key of Object.keys(this.listeners)) {
                this.listeners[key as keyof typeof this.listeners] = [];
            }
        };
    }

    public setLayout(layout: LayoutMethod) {
        this.layoutMethod = layout;
    }

    public addEventListener<T extends keyof CausalViewEventListeners, E extends CausalViewEventListeners[T]>(
        eventName: T, callback: E
    ) {
        this.listeners[eventName].push(callback);
    }

    public removeEventListener<T extends keyof CausalViewEventListeners, E extends CausalViewEventListeners[T]>(
        eventName: T, callback: E
    ) {
        this.listeners[eventName] = this.listeners[eventName].filter(cb => cb !== callback);
    }

    public fireEvent<T extends keyof CausalViewEventListeners, E extends CausalViewEventListeners[T]>(
        eventName: T, ...args: Parameters<E>
    ) {
        for (const cb of this.listeners[eventName]) {
            // @ts-expect-error this is correct
            cb(...args);
        }
    }

    public setExplorationKey(explorationKey: ExplorationKey) {
        this.explorationKey = explorationKey;
    }

    public setNodeSelectionMode(selectionMode: NodeSelectionMode) {
        this.graphNodeSelectionMode = selectionMode;
    }

    public toggleNodeSelected(fid: string) {
        switch (this.graphNodeSelectionMode) {
            case NodeSelectionMode.SINGLE: {
                if (this.selectedField?.fid === fid) {
                    this.selectedFidArr$.next([]);
                    return false;
                } else {
                    this.selectedFidArr$.next([fid]);
                    return true;
                }
            }
            case NodeSelectionMode.DOUBLE: {
                if (this.selectedFieldGroup.some(f => f.fid === fid)) {
                    this.selectedFidArr$.next(this.selectedFieldGroup.filter(f => f.fid !== fid).map(f => f.fid));
                    return false;
                } else if (this.selectedFieldGroup.length === 0) {
                    this.selectedFidArr$.next([fid]);
                    return true;
                } else if (this.selectedFieldGroup.length !== 1) {
                    return false;
                }
                this.selectedFidArr$.next([this.selectedFieldGroup[0].fid, fid]);
                return false;
            }
            case NodeSelectionMode.MULTIPLE: {
                const selectedFidArr = this.selectedFieldGroup.map(f => f.fid);
                this.selectedFidArr$.next(produce(selectedFidArr, draft => {
                    const matchedIndex = draft.findIndex(f => f === fid);
                    if (matchedIndex !== -1) {
                        draft.splice(matchedIndex, 1);
                    } else {
                        draft.push(fid);
                    }
                }));
                break;
            }
            default: {
                return undefined;
            }
        }
    }

    public selectNode(fid: string) {
        switch (this.graphNodeSelectionMode) {
            case NodeSelectionMode.SINGLE: {
                if (this.selectedField?.fid === fid) {
                    this.selectedFidArr$.next([]);
                    return false;
                } else {
                    this.selectedFidArr$.next([fid]);
                    return true;
                }
            }
            case NodeSelectionMode.MULTIPLE: {
                const selectedFidArr = this.selectedFieldGroup.map(f => f.fid);
                this.selectedFidArr$.next(produce(selectedFidArr, draft => {
                    const matchedIndex = draft.findIndex(f => f === fid);
                    if (matchedIndex === -1) {
                        draft.push(fid);
                    }
                }));
                break;
            }
            default: {
                return undefined;
            }
        }
    }

    public clearSelected() {
        this.selectedFidArr$.next([]);
    }

    public openAlgorithmPanel() {
        this.shouldDisplayAlgorithmPanel = true;
    }

    public closeAlgorithmPanel() {
        this.shouldDisplayAlgorithmPanel = false;
    }

    public setNodeRenderer(handleRender: typeof this.onRenderNode) {
        this.onRenderNode = handleRender;
        this.graph?.update();
    }

    public clearLocalWeights() {
        this.localWeights = undefined;
    }

    public setLocalWeights(irResult: IRInsightExplainResult) {
        const weights = new Map<string, Map<string, number>>();
        for (const link of irResult.causalEffects) {
            if (!weights.has(link.src)) {
                weights.set(link.src, new Map<string, number>());
            }
            weights.get(link.src)!.set(link.tar, link.responsibility);
        }
        this.localWeights = weights;
    }

    public pushPredictResult(result: typeof this.predictCache[number]) {
        this.predictCache.push(result);
    }

    public clearPredictResults() {
        this.predictCache = [];
    }

    public setLocalRenderData(data: CausalViewStore['localData']) {
        this.localData = data;
    }

}


const CausalViewContext = createContext<CausalViewStore | null>(null);

export const useCausalViewProvider = (causalStore: CausalStore): FC => {
    const context = useMemo(() => new CausalViewStore(causalStore), [causalStore]);

    useEffect(() => {
        const ref = context;
        return () => {
            ref.destroy();
        };
    }, [context]);

    useEffect(() => {
        causalStore.operator.connect();
        return () => {
            causalStore.operator.disconnect();
        };
    }, [causalStore]);

    return useCallback(function CausalViewProvider ({ children }) {
        return createElement(CausalViewContext.Provider, { value: context }, children);
    }, [context]);
};

export const useCausalViewContext = () => useContext(CausalViewContext);
