import type { IDropdownOption } from "@fluentui/react";
import { makeAutoObservable, reaction, runInAction } from "mobx";
import { distinctUntilChanged, Subject, switchAll } from "rxjs";
import { getGlobalStore } from "..";
import { notify } from "../../components/error";
import type { IFieldMeta } from "../../interfaces";
import { IAlgoSchema, IFunctionalDep, makeFormInitParams, PagLink, PAG_NODE } from "../../pages/causal/config";
import { causalService } from "../../pages/causal/service";
import type { IteratorStorage } from "../../utils/iteStorage";
import type { DataSourceStore } from "../dataSourceStore";
import { findUnmatchedCausalResults, resolveCausality } from "./pag";


export default class CausalOperatorStore {

    public causalServer = (
        decodeURIComponent(new URL(window.location.href).searchParams.get('causalServer') ?? '').replace(/\/$/, '')
        || `${window.location.protocol}//causal.gateway.kanaries.net`
    );

    public busy = false;

    protected _causalAlgorithmForm: IAlgoSchema = {};
    public get causalAlgorithmForm(): IAlgoSchema {
        return this._causalAlgorithmForm;
    }
    public params: { [algo: string]: { [key: string]: any } } = {};
    protected set causalAlgorithmForm(schema: IAlgoSchema) {
        if (Object.keys(schema).length === 0) {
            console.error('[causalAlgorithmForm]: schema is empty');
            return;
        }
        this._causalAlgorithmForm = schema;
    }
    public get causalAlgorithmOptions() {
        return Object.entries(this._causalAlgorithmForm).map(([key, form]) => {
            return { key: key, text: `${key}: ${form.title}` } as IDropdownOption;
        });
    }
    protected _algorithm: string | null = null;
    public get algorithm() {
        return this._algorithm;
    }
    public set algorithm(algoName: string | null) {
        if (this.busy) {
            return;
        } else if (algoName === null) {
            this._algorithm = null;
        } else if (algoName in this._causalAlgorithmForm) {
            this._algorithm = algoName;
        }
    }

    public readonly destroy: () => void;

    constructor(dataSourceStore: DataSourceStore) {
        const allFields$ = new Subject<IFieldMeta[]>();
        const dynamicFormSchema$ = new Subject<ReturnType<typeof this.fetchCausalAlgorithmList>>();

        makeAutoObservable(this, {
            destroy: false,
        });

        const mobxReactions = [
            reaction(() => dataSourceStore.fieldMetas, fieldMetas => {
                allFields$.next(fieldMetas);
            }),
            // this reaction requires `makeAutoObservable` to be called before
            reaction(() => this._causalAlgorithmForm, form => {
                runInAction(() => {
                    this._algorithm = null;
                    this.params = {};
                    for (const algoName of Object.keys(form)) {
                        this.params[algoName] = makeFormInitParams(form[algoName]);
                    }
                    const [firstAlgoName] = Object.keys(form);
                    if (firstAlgoName) {
                        this._algorithm = firstAlgoName;
                    }
                });
            }),
        ];

        const rxReactions = [
            // fetch schema
            allFields$.pipe(
                distinctUntilChanged((prev, next) => {
                    return prev.length === next.length && next.every(f => prev.some(which => which.fid === f.fid));
                }),
            ).subscribe(fields => {
                runInAction(() => {
                    this.causalAlgorithmForm = {};
                });
                dynamicFormSchema$.next(this.fetchCausalAlgorithmList(fields));
            }),
            // update form
            dynamicFormSchema$.pipe(
                switchAll()
            ).subscribe(schema => {
                runInAction(() => {
                    this.causalAlgorithmForm = schema ?? {};
                });
            }),
        ];

        this.destroy = () => {
            mobxReactions.forEach(dispose => dispose());
            rxReactions.forEach(subscription => subscription.unsubscribe());
        };
    }
    
    protected async fetchCausalAlgorithmList(fields: readonly IFieldMeta[]): Promise<IAlgoSchema | null> {
        try {
            const schema: IAlgoSchema = await fetch(`${this.causalServer}/algo/list`, {
                method: 'POST',
                body: JSON.stringify({
                    fieldIds: fields.map((f) => f.fid),
                    fieldMetas: fields,
                }),
                headers: {
                    'Content-Type': 'application/json',
                },
            }).then((resp) => resp.json());
            return schema;
        } catch (error) {
            console.error('[CausalAlgorithmList error]:', error);
            return null;
        }
    }

    public async computeMutualMatrix(data: IteratorStorage, fields: readonly IFieldMeta[]): Promise<number[][] | null> {
        const dataSource = await data.getAll();
        const res = await causalService({ task: 'ig', dataSource, fields });
        return res;
    }

    public async computeCondMutualMatrix(
        data: IteratorStorage, fields: readonly IFieldMeta[], mutualMatrix: readonly (readonly number[])[]
    ): Promise<number[][] | null> {
        const dataSource = await data.getAll();
        const res = await causalService({ task: 'ig_cond', dataSource, fields, matrix: mutualMatrix });
        return res;
    }

    public async causalDiscovery(
        data: IteratorStorage,
        fields: readonly IFieldMeta[],
        functionalDependencies: readonly IFunctionalDep[],
        assertions: readonly PagLink[],
    ): Promise<{ raw: number[][]; pag: PagLink[] } | null> {
        if (this.busy) {
            return null;
        }
        let causality: { raw: number[][]; pag: PagLink[] } | null = null;
        const { fieldMetas: allFields } = getGlobalStore().dataSourceStore;
        const focusedFields = fields.map(f => {
            return allFields.findIndex(which => which.fid === f.fid);
        }).filter(idx => idx !== -1);
        const algoName = this._algorithm;
        const inputFields = focusedFields.map(idx => allFields[idx]);
        if (!algoName) {
            notify({
                title: 'Causal Discovery Error',
                type: 'error',
                content: 'Algorithm is not chosen yet.',
            });
            return null;
        }
        try {
            runInAction(() => {
                this.busy = true;
            });
            const originFieldsLength = inputFields.length;
            const dataSource = await data.getAll();
            const res = await fetch(`${this.causalServer}/causal/${algoName}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    dataSource,
                    fields: allFields,
                    focusedFields: inputFields.map(f => f.fid),
                    bgKnowledgesPag: assertions,
                    funcDeps: functionalDependencies,
                    params: this.params[algoName],
                }),
            });
            const result = await res.json();
            if (result.success) {
                const rawMatrix = result.data.matrix as PAG_NODE[][];
                const causalMatrix = rawMatrix
                    .slice(0, originFieldsLength)
                    .map((row) => row.slice(0, originFieldsLength));
                const causalPag = resolveCausality(causalMatrix, inputFields);
                causality = { raw: causalMatrix, pag: causalPag };
                const unmatched = findUnmatchedCausalResults(assertions, causalPag);
                if (unmatched.length > 0 && process.env.NODE_ENV !== 'production') {
                    const getFieldName = (fid: string) => {
                        const field = inputFields.find(f => f.fid === fid);
                        return field?.name ?? fid;
                    };
                    for (const info of unmatched) {
                        notify({
                            title: 'Causal Result Not Matching',
                            type: 'error',
                            content: `Conflict in edge "${getFieldName(info.srcFid)} -> ${getFieldName(info.tarFid)}":\n`
                                + `  Expected: ${info.expected.src_type} -> ${info.expected.tar_type}\n`
                                + `  Received: ${info.received.src_type} -> ${info.received.tar_type}`,
                        });
                    }
                }
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            notify({
                title: 'Causal Discovery Error',
                type: 'error',
                content: `${error}`,
            });
        } finally {
            runInAction(() => {
                this.busy = false;
            });
        }
        return causality;
    }

    public updateConfig(algoName: string, params: typeof this.params[string]): boolean {
        this.algorithm = algoName;
        if (this._algorithm !== null && this._algorithm in this.params) {
            this.params[this._algorithm] = params;
            return true;
        }
        return false;
    }

}
