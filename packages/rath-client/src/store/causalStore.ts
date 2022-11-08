import type { IDropdownOption } from '@fluentui/react';
import { makeAutoObservable, observable, runInAction } from 'mobx';
import { notify } from '../components/error';
import type { IFieldMeta, IRow } from '../interfaces';
import { CAUSAL_ALGORITHM_FORM, ICausalAlgorithm, makeFormInitParams, PC_PARAMS_FORM, IAlgoSchema, CAUSAL_ALGORITHM_OPTIONS, BgKnowledge } from '../pages/causal/config';
import { causalService } from '../pages/causal/service';
import { DataSourceStore } from './dataSourceStore';

enum CausalServerUrl {
    local = 'http://localhost:8000',
    // test = 'http://gateway.kanaries.cn:2080/causal',
    // test = 'http://wujiaxins-MacBook-Pro.local:8000',
    test = 'http://dev02-thinkpad-t14-gen-2a.local:2281',//FIXME:
}
export class CausalStore {
    public igMatrix: number[][] = [];
    public igCondMatrix: number[][] = [];
    public computing: boolean = false;
    public showSettings: boolean = false;
    public focusNodeIndex: number = 0;
    /** Name of algorithm selected to be used in next call, modified in the settings panel */
    public causalAlgorithm: string = ICausalAlgorithm.PC;
    /** Fields received from algorithm, the starting N items are equals to `inputFields`, and then there may have some extra trailing fields built during the process, the size of it is C (C >= N) */
    public causalFields: IFieldMeta[] = [];
    /** An (N x N) matrix of flags representing the links between any two nodes */
    public causalStrength: number[][] = [];
    /** asserts algorithm in keys of `causalStore.causalAlgorithmForm`. */
    public causalParams: { [algo: string]: { [key: string]: any } } = {
        // alpha: 0.05,
        // indep_test: IndepenenceTest.fisherZ,
        // stable: true,
        // uc_rule: UCRule.uc_supset,
        // uc_priority: UCPriority.default,
        // mvpc: false,
        // catEncodeType: ICatEncodeType.none, // encoding for catecorical data
        // quantEncodeType: IQuantEncodeType.none, // encoding for quantitative data
        // keepOriginCat: true,
        // keepOriginQuant: true
    }; // save

    /** Keep the options synchorized with `CausalStore.causalAlgorithmForm` */
    private _causalAlgorithmOptions: IDropdownOption[] = CAUSAL_ALGORITHM_OPTIONS;
    private _fetchedCausalAlgorithmForm: IAlgoSchema = Object.fromEntries(Object.entries(CAUSAL_ALGORITHM_FORM));
    public get causalAlgorithmOptions(): IDropdownOption[] {
        return this._causalAlgorithmOptions;
        // console.log(this.causalAlgorithmForm)
        // for (let [key, schema] of this.causalAlgorithmForm.entries()) {
        //     options.push({ key, text: schema.title, ariaLabel: schema.description } as IDropdownOption)
        // } return options;
    }
    public get causalAlgorithmForm(): IAlgoSchema {
        return this._fetchedCausalAlgorithmForm;
    }
    public set causalAlgorithmForm(schema: IAlgoSchema) {
        if (Object.keys(schema).length === 0) {
            console.error("[causalAlgorithmForm]: schema is empty")
            return;
        }
        this._fetchedCausalAlgorithmForm = schema;
        this._causalAlgorithmOptions = Object.entries(schema).map(([key, form]) => {
            return { key: key, text: `${key}: ${form.title}` } as IDropdownOption
        })
        let firstAlgorithm = Object.entries(schema)[0]
        this.causalAlgorithm = firstAlgorithm[0];
        for (let entry of Object.entries(schema)) {
            this.causalParams[entry[0]] = makeFormInitParams(entry[1]);
        }
    }
    private causalServer = decodeURIComponent(
        new URL(window.location.href).searchParams.get('causalServer') ?? ''
    ) || CausalServerUrl.test; // FIXME:
    private dataSourceStore: DataSourceStore;
    constructor(dataSourceStore: DataSourceStore) {
        this.dataSourceStore = dataSourceStore;
        this.causalAlgorithm = ICausalAlgorithm.PC;
        this.causalParams[ICausalAlgorithm.PC] = makeFormInitParams(PC_PARAMS_FORM);
        this.updateCausalAlgorithmList(dataSourceStore.fieldMetas);
        makeAutoObservable(this, {
            causalFields: observable.ref,
            causalStrength: observable.ref,
            igMatrix: observable.ref,
            igCondMatrix: observable.ref,
            // @ts-ignore
            dataSourceStore: false,
        });
    }
    public switchCausalAlgorithm(algorithm: string) {
        if (this.causalAlgorithmForm[algorithm] !== undefined) {
            this.causalAlgorithm = algorithm;
            // this.causalParams[algorithm] = // makeFormInitParams(this.causalAlgorithmForm[algorithm]);
            return true;
        } else {
            console.error(`[switchCausalAlgorithm error]: algorithm ${algorithm} not known.`)
            return false;
        }
    }
    public updateCausalAlgoAndParams(algorithm: string, params: CausalStore['causalParams']) {
        if (this.switchCausalAlgorithm(algorithm)) {
            this.causalParams[algorithm] = params;
        }
    }
    public updateCausalParamsValue(key: string, value: any) {
        this.causalParams[this.causalAlgorithm][key] = value;
    }
    public toggleSettings(show: boolean) {
        this.showSettings = show;
    }
    public setFocusNodeIndex(index: number) {
        this.focusNodeIndex = index;
    }

    public async computeIGMatrix(dataSource: IRow[], fields: IFieldMeta[]) {
        this.computing = true;
        const res = await causalService({ task: 'ig', dataSource, fields });
        runInAction(() => {
            this.igMatrix = res;
            this.computing = false;
        });
    }
    public async computeIGCondMatrix(dataSource: IRow[], fields: IFieldMeta[]) {
        this.computing = true;
        const res = await causalService({ task: 'ig_cond', dataSource, fields, matrix: this.igMatrix });
        runInAction(() => {
            this.igCondMatrix = res;
            this.computing = false;
        });
    }
    public async updateCausalAlgorithmList(fields: IFieldMeta[]) {
        try {
            const schema: IAlgoSchema = await fetch(`${this.causalServer}/algo/list`, {
                method: 'POST',
                body: JSON.stringify({
                    fieldIds: fields.map(f => f.fid),
                    fieldMetas: fields,
                }),
                headers: {
                    'Content-Type': 'application/json',
                },
            }).then(resp => resp.json());
            this.causalAlgorithmForm = schema;
            // for (let [algoName, algoSchema] of schema.entries()) {
            // }

        } catch(error) {
            console.error('[CausalAlgorithmList error]:', error);
        }
    }
    public async causalDiscovery(dataSource: IRow[], fields: IFieldMeta[], focusFields: string[], precondition: BgKnowledge[]) {
        const algoName = this.causalAlgorithm;
        const inputFields = focusFields.map(fid => fields.find(f => f.fid === fid)! ?? fid);
        if (inputFields.some(f => typeof f === 'string')) {
            notify({
                title: 'Causal Discovery Error',
                type: 'error',
                content: `Fields ${inputFields.filter(f => typeof f === 'string').join(', ')} not found`,
            });
            return;
        }
        try {
            this.computing = true;
            this.causalFields = [];
            this.causalStrength = [];
            const originFieldsLength = inputFields.length;
            const res = await fetch(`${this.causalServer}/causal/${algoName}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    dataSource, // encodeDiscrte(dataSource, fields),
                    fields,
                    focusedFields: focusFields,
                    bgKnowledges: precondition,
                    params: this.causalParams[algoName],
                }),
            });
            const result = await res.json();
            if (result.success) {
                runInAction(() => {
                    this.causalFields = inputFields;
                    this.causalStrength = (result.data as number[][]).slice(0, originFieldsLength).map(row => row.slice(0, originFieldsLength));
                });
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
            this.computing = false;
        }
    }
    public async reRunCausalDiscovery(dataSource: IRow[], focusFields: string[], precondition: BgKnowledge[]) {
        const { fieldMetas } = this.dataSourceStore;
        this.causalDiscovery(dataSource, fieldMetas, focusFields, precondition);
    }
}
