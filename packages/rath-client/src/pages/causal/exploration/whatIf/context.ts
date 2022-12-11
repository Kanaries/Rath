import produce from "immer";
import { makeAutoObservable, observable, reaction, runInAction } from "mobx";
import { createContext, FC, useContext, useMemo, createElement, useEffect, useCallback } from "react";
import { map, share, Subject, switchAll, throttleTime } from "rxjs";
import { getGlobalStore } from "../../../../store";
import { IAlgoSchema, makeFormInitParams } from "../../config";
import { shouldFormItemDisplay } from "../../dynamicForm";
import { predicateWhatIf, fetchWhatIfParamSchema, IWhatIfServiceResult } from "./service";


class WhatIfStore {
    
    public form: IAlgoSchema | null = null;
    public allParams: { readonly [algoName: string]: { readonly [key: string]: any } } = {};
    public algoName = '';

    public conditions: { readonly [fid: string]: number } = {};
    public predication: { readonly [fid: string]: number } = {};

    public busy = false;

    protected expandTargets: string[] = [];
    protected tempModelId: string | null = null;

    public readonly destroy: () => void;

    constructor() {
        makeAutoObservable(this, {
            form: observable.ref,
            allParams: observable.ref,
            conditions: observable.ref,
            predication: observable.ref,
            // @ts-expect-error non-public fields
            expandTargets: false,
            tempModelId: false,
        });

        const predicateFlag$ = new Subject<void>();

        fetchWhatIfParamSchema().then(res => {
            runInAction(() => {
                this.form = res;
            });
        });

        const mobxReactions = [
            reaction(() => this.form, form => {
                runInAction(() => {
                    if (form && Object.keys(form).length) {
                        this.algoName = Object.keys(form)[0];
                        const allParams: {
                            -readonly [key in keyof WhatIfStore['allParams']]: WhatIfStore['allParams'][key];
                        } = {};
                        for (const key of Object.keys(form)) {
                            allParams[key] = makeFormInitParams(form[key]);
                        }
                        this.allParams = allParams;
                    } else {
                        this.allParams = {};
                        this.algoName = '';
                    }
                });
            }),
            reaction(() => this.conditions, () => {
                predicateFlag$.next();
            }),
        ];

        const predicateTask$ = predicateFlag$.pipe(
            throttleTime(400, undefined, { trailing: true }),
            map(() => this.predicate()),
            share(),
        );

        const rxjsSubscriptions = [
            predicateTask$.subscribe(() => {
                runInAction(() => {
                    this.busy = true;
                });
            }),
            predicateTask$.pipe(
                switchAll(),
            ).subscribe(result => {
                runInAction(() => {
                    this.busy = false;
                    this.predication = result ? result.base : {};
                });
            }),
        ];
        
        this.destroy = () => {
            mobxReactions.forEach(dispose => dispose());
            rxjsSubscriptions.forEach(subscription => subscription.unsubscribe());
        };
    }

    public switchAlgorithm(algoName: string) {
        if (algoName in this.allParams) {
            this.algoName = algoName;
        }
    }

    public updateParam(key: string, value: any) {
        this.allParams = produce(this.allParams, draft => {
            draft[this.algoName][key] = value;
        });
    }

    public setCondition(fid: string, value: number) {
        this.conditions = produce(this.conditions, draft => {
            draft[fid] = value;
        });
    }

    public removeCondition(fid: string) {
        const { [fid]: _, ...others } = this.conditions;
        this.conditions = others;
    }

    public clearConditions() {
        this.conditions = {};
    }

    protected async predicate(): Promise<IWhatIfServiceResult | null> {
        const algoName = this.algoName;
        const conditions = this.conditions;
        const allParams = this.allParams;
        if (!this.form || !(algoName in this.allParams)) {
            return null;
        }
        const params = Object.fromEntries(this.form[algoName].items.filter(item => {
            return shouldFormItemDisplay(item, allParams[algoName]);
        }).map(item => [item.key, allParams[algoName][item.key]]));
        const result = await predicateWhatIf(conditions, algoName, params, this.tempModelId ?? getGlobalStore().causalStore.model.modelId);
        return result;
    }

}


const WhatIfContext = createContext<WhatIfStore | null>(null);

export const useWhatIfProvider = (): FC => {
    const context = useMemo(() => new WhatIfStore(), []);

    useEffect(() => {
        const ref = context;
        return () => {
            ref.destroy();
        };
    }, [context]);

    return useCallback(function WhatIfProvider ({ children }) {
        return createElement(WhatIfContext.Provider, { value: context }, children);
    }, [context]);
};

export const useWhatIfContext = () => useContext(WhatIfContext);

export const useWhatIfProviderAndContext = (): [FC, WhatIfStore] => {
    const context = useMemo(() => new WhatIfStore(), []);

    useEffect(() => {
        const ref = context;
        return () => {
            ref.destroy();
        };
    }, [context]);

    return [useCallback(function WhatIfProvider ({ children }) {
        return createElement(WhatIfContext.Provider, { value: context }, children);
    }, [context]), context];
};
