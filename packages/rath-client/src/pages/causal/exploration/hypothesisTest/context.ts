import produce from "immer";
import { makeAutoObservable, observable, reaction, runInAction } from "mobx";
import { createContext, FC, useContext, useMemo, createElement, useEffect, useCallback } from "react";
import { getGlobalStore } from "../../../../store";
import { IForm, makeFormInitParams } from "../../config";
import { shouldFormItemDisplay } from "../../dynamicForm";
import { estimate, fetchHypothesisTestParamSchema, IHypothesisTestServiceResult } from "./service";


class HypothesisTestStore {
    
    public form: IForm | null = null;
    public params: { readonly [key: string]: any } = {};

    public definitions: Readonly<Parameters<typeof estimate>[0]> = {
        confounders: [],
        effectModifiers: [],
        outcome: '',
        populationPicker: [],
        predicates: [],
    };

    public busy = false;
    public okToRun = false;
    public logs: Readonly<{
        beginTime: number;
        endTime: number;
        props: Parameters<typeof estimate>[0];
        params: Parameters<typeof estimate>[1];
        data: IHypothesisTestServiceResult;
    }>[] = [];

    public readonly destroy: () => void;

    constructor() {
        makeAutoObservable(this, {
            form: observable.ref,
            params: observable.ref,
            definitions: observable.ref,
            logs: observable.shallow,
        });

        fetchHypothesisTestParamSchema().then(res => {
            runInAction(() => {
                this.form = res;
            });
        });

        const mobxReactions = [
            reaction(() => this.form, form => {
                runInAction(() => {
                    this.params = form ? makeFormInitParams(form) : {};
                });
            }),
            reaction(() => this.definitions, defs => {
                const { causalStore: { dataset: { allFields } } } = getGlobalStore();
                runInAction(() => {
                    this.okToRun = defs.predicates.length > 0 && allFields.some(f => f.fid === defs.outcome);
                });
            }),
        ];
        
        this.destroy = () => {
            mobxReactions.forEach(dispose => dispose());
        };
    }

    public updateParam(key: string, value: any) {
        this.params = produce(this.params, draft => {
            draft[key] = value;
        });
    }

    public updateDefinition<K extends keyof typeof this.definitions>(key: K, value: (typeof this.definitions)[K]) {
        this.definitions = produce(this.definitions, draft => {
            // @ts-expect-error mutable
            draft[key] = value;
        });
    }

    public async run() {
        if (this.busy || !this.okToRun || !this.form) {
            return null;
        }
        runInAction(() => {
            this.busy = true;
        });
        const beginTime = Date.now();
        const props = { ...this.definitions };
        const params = Object.fromEntries(this.form.items.filter(item => {
            return shouldFormItemDisplay(item, this.params);
        }).map(item => [item.key, this.params[item.key]]));
        const result = await estimate(props, params);
        const endTime = Date.now();
        runInAction(() => {
            if (result) {
                this.logs.push({
                    beginTime,
                    endTime,
                    props,
                    params,
                    data: result,
                });
            }
            this.busy = false;
        });
    }

    public clearLogs() {
        this.logs = [];
    }

}


const HypothesisTestContext = createContext<HypothesisTestStore | null>(null);

export const useHypothesisTestProvider = (): FC => {
    const context = useMemo(() => new HypothesisTestStore(), []);

    useEffect(() => {
        const ref = context;
        return () => {
            ref.destroy();
        };
    }, [context]);

    return useCallback(function HypothesisTestProvider ({ children }) {
        return createElement(HypothesisTestContext.Provider, { value: context }, children);
    }, [context]);
};

export const useHypothesisTestContext = () => useContext(HypothesisTestContext);
