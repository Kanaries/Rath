import produce from "immer";
import { makeAutoObservable, observable, reaction, runInAction } from "mobx";
import { createContext, FC, useContext, useMemo, createElement, useEffect, useCallback } from "react";
import { Subject, withLatestFrom } from "rxjs";
import type { IFieldMeta } from "../../interfaces";
import type { GraphNodeAttributes } from "../../pages/causal/explorer/graph-utils";
import type { IPredictResult, PredictAlgorithm } from "../../pages/causal/predict";
import type { IRInsightExplainResult } from "../../workers/insight/r-insight.worker";
import type CausalStore from "./mainStore";


export enum NodeSelectionMode {
    NONE,
    SINGLE,
    MULTIPLE,
}

export enum ExplorationKey {
    // CAUSAL_BLAME = 'CausalBlame',
    AUTO_VIS = 'AutoVis',
    CROSS_FILTER = 'CrossFilter',
    CAUSAL_INSIGHT = 'CausalInsight',
    GRAPHIC_WALKER = 'GraphicWalker',
    PREDICT = 'predict',
}

export const ExplorationKeys = [
    // ExplorationKey.CAUSAL_BLAME,
    ExplorationKey.AUTO_VIS,
    ExplorationKey.CROSS_FILTER,
    ExplorationKey.CAUSAL_INSIGHT,
    ExplorationKey.GRAPHIC_WALKER,
    ExplorationKey.PREDICT,
] as const;

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

    public shouldDisplayAlgorithmPanel = false;

    public onRenderNode: ((node: Readonly<IFieldMeta>) => GraphNodeAttributes | undefined) | undefined;
    public localWeights: Map<string, Map<string, number>> | undefined;
    public predictCache: {
        id: string; algo: PredictAlgorithm; startTime: number; completeTime: number; data: IPredictResult;
    }[];
    
    public readonly destroy: () => void;

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
            // @ts-expect-error non-public field
            _selectedNodes: observable.ref,
            selectedFidArr$: false,
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
                        default: {
                            this.graphNodeSelectionMode = NodeSelectionMode.NONE;
                        }
                    }
                });
            }),
            reaction(() => this.graphNodeSelectionMode, graphNodeSelectionMode => {
                runInAction(() => {
                    switch (graphNodeSelectionMode) {
                        case NodeSelectionMode.SINGLE: {
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
        };
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

    return useCallback(function CausalViewProvider ({ children }) {
        return createElement(CausalViewContext.Provider, { value: context }, children);
    }, [context]);
};

export const useCausalViewContext = () => useContext(CausalViewContext);
