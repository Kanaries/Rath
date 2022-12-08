import produce from "immer";
import { makeAutoObservable, observable, reaction, runInAction } from "mobx";
import { createContext, FC, useContext, useMemo, createElement, useEffect, useCallback } from "react";
import { IForm, makeFormInitParams } from "../../config";
import { doWhy, fetchDoWhyParamSchema, IDoWhyServiceResult } from "./service";


class DoWhyStore {
    
    public form: IForm | null = null;
    public params: { readonly [key: string]: any } = {};

    public definitions: Readonly<Parameters<typeof doWhy>[0]> = {
        confounders: [],
        effectModifiers: [],
        outcome: '',
        populationPicker: [],
        predicates: [],
    };

    public busy = false;
    public logs: Readonly<{
        beginTime: number;
        endTime: number;
        props: Parameters<typeof doWhy>[0];
        params: Parameters<typeof doWhy>[1];
        data: IDoWhyServiceResult;
    }>[] = [];

    public readonly destroy: () => void;

    constructor() {
        makeAutoObservable(this, {
            form: observable.ref,
            params: observable.ref,
            definitions: observable.ref,
            logs: observable.shallow,
        });

        fetchDoWhyParamSchema().then(res => {
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
        if (this.busy) {
            return null;
        }
        runInAction(() => {
            this.busy = true;
        });
        const beginTime = Date.now();
        const props = { ...this.definitions };
        const params = { ...this.params };
        const result = await doWhy(props, params);
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


const DoWhyContext = createContext<DoWhyStore | null>(null);

export const useDoWhyProvider = (): FC => {
    const context = useMemo(() => new DoWhyStore(), []);

    useEffect(() => {
        const ref = context;
        return () => {
            ref.destroy();
        };
    }, [context]);

    return useCallback(function DoWhyProvider ({ children }) {
        return createElement(DoWhyContext.Provider, { value: context }, children);
    }, [context]);
};

export const useDoWhyContext = () => useContext(DoWhyContext);
