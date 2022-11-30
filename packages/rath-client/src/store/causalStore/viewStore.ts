import { makeAutoObservable, reaction } from "mobx";
import { createContext, FC, useContext, useMemo, createElement, useEffect, useCallback } from "react";
import type CausalStore from "./mainStore";


export enum NodeSelectionMode {
    NONE,
    SINGLE,
    MULTIPLE,
}

export enum ExplorationKey {
    AUTO_VIS = 'AutoVis',
    CROSS_FILTER = 'CrossFilter',
    CAUSAL_INSIGHT = 'CausalInsight',
    GRAPHIC_WALKER = 'GraphicWalker',
    PREDICT = 'predict',
}

export const ExplorationOptions = [
    { key: ExplorationKey.AUTO_VIS, text: '自动可视化' },
    { key: ExplorationKey.CROSS_FILTER, text: '因果验证' },
    { key: ExplorationKey.CAUSAL_INSIGHT, text: '可解释探索' },
    { key: ExplorationKey.GRAPHIC_WALKER, text: '可视化自助分析' },
    { key: ExplorationKey.PREDICT, text: '模型预测' },
] as const;

class CausalViewStore {

    public explorationKey = ExplorationKey.AUTO_VIS;
    public graphNodeSelectionMode = NodeSelectionMode.NONE;

    protected _selectedNodes: readonly string[] = [];
    public get selectedFieldGroup() {
        return this._selectedNodes.slice(0);
    }
    public get selectedField() {
        return this._selectedNodes.at(0) ?? null;
    }

    public readonly destroy: () => void;

    constructor(causalStore: CausalStore) {
        const mobxReactions = [
            reaction(() => causalStore.model.mergedPag, () => {
                this._selectedNodes = [];
            }),
            reaction(() => this.explorationKey, explorationKey => {
                switch (explorationKey) {
                    case ExplorationKey.AUTO_VIS:
                    case ExplorationKey.CAUSAL_INSIGHT:
                    case ExplorationKey.PREDICT: {
                        this.graphNodeSelectionMode = NodeSelectionMode.SINGLE;
                        this._selectedNodes = this._selectedNodes.slice(0, 1);
                        break;
                    }
                    case ExplorationKey.CROSS_FILTER: {
                        this.graphNodeSelectionMode = NodeSelectionMode.MULTIPLE;
                        break;
                    }
                    default: {
                        this.graphNodeSelectionMode = NodeSelectionMode.NONE;
                        this._selectedNodes = [];
                    }
                }
            }),
        ];

        makeAutoObservable(this);

        this.destroy = () => {
            mobxReactions.forEach(dispose => dispose());
        };
    }

    public setExplorationKey(explorationKey: ExplorationKey) {
        this.explorationKey = explorationKey;
    }

    public setNodeSelectionMode(selectionMode: NodeSelectionMode) {
        this.graphNodeSelectionMode = selectionMode;
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
