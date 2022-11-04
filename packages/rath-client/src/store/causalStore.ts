import { getFieldRelationMatrix } from "@kanaries/loa";
import { makeAutoObservable, observable, runInAction } from "mobx";
import { notify } from "../components/error";
import { IFieldMeta, IRow } from "../interfaces";
import { causalService } from "../pages/causal/service";
import { encodeDiscrete } from "../pages/causal/utils";
import { DataSourceStore } from "./dataSourceStore";

export enum UCRule {
    uc_supset = 0,
    maxP = 1,
    definiteMaxP = 2
}

export enum UCPriority {
    default = -1,
    overwrite = 0,
    biDirected = 1,
    existing = 2,
    stronger = 3,
    stronger_plus = 4
}

export enum ICausalAlgorithm {
    PC = 'PC',
    FCI = 'FCI',
    CONOD = 'CONOD'
}

export enum IndepenenceTest {
    chiSquare = 'chisq',
    fisherZ = 'fisherz',
    kci = 'kci',
    mvFisherz = 'mv_fisherz',
    gSquare = 'gsq',
}
// type UCPriority = -1 | 0 | 1 | 2 | 3 | 4;
// type UCRule = 0 | 1 | 2; 
export interface ICausalParams {
    algorithm?: ICausalAlgorithm; // | 'FCI' | 'CDNOD';
    alpha?: number; //desired significance level (float) in (0, 1). Default: 0.05.
    indep_test?: IndepenenceTest;
    stable?: boolean; //run stabilized skeleton discovery if True. Default: True.
    uc_rule?: UCRule;
    uc_priority?: UCPriority;
    mvpc?: boolean;
}
export class CausalStore {
    public igMatrix: number[][] = [];
    public igCondMatrix: number[][] = [];
    public causalStrength: number[][] = [];
    public computing: boolean = false;
    public showSettings: boolean = false;
    public focusNodeIndex: number = 0;
    public causalParams: ICausalParams = {
        algorithm: ICausalAlgorithm.PC,
        alpha: 0.05,
        indep_test: IndepenenceTest.fisherZ,
        stable: true,
        uc_rule: UCRule.uc_supset,
        uc_priority: UCPriority.default,
        mvpc: false
    };
    private dataSourceStore: DataSourceStore;
    constructor (dataSourceStore: DataSourceStore) {
        this.dataSourceStore = dataSourceStore
        makeAutoObservable(this, {
            causalStrength: observable.ref,
            igMatrix: observable.ref,
            igCondMatrix: observable.ref,
            // @ts-ignore
            dataSourceStore: false
        })
    }
    public updateCausalParamsValue (key: keyof ICausalParams, value: any) {
        this.causalParams[key] = value;
    }
    public toggleSettings (show: boolean) {
        this.showSettings = show;
    }
    public setFocusNodeIndex (index: number) {
        this.focusNodeIndex = index;
    }

    public computeIGMatrix (dataSource: IRow[], fields: IFieldMeta[]) {
        this.igMatrix = getFieldRelationMatrix(dataSource, fields);
    }
    public async computeIGCondMatrix (dataSource: IRow[], fields: IFieldMeta[]) {
        this.computing = true;
        const res = await causalService({ dataSource, fields, matrix: this.igMatrix });
        runInAction(() => {
            this.igCondMatrix = res;
            this.computing = false
        })
    }
    public async causalDiscovery (dataSource: IRow[], fields: IFieldMeta[]) {
        try {
            const res = await fetch('http://gateway.kanaries.cn:2080/causal/causal/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    dataSource,// encodeDiscrte(dataSource, fields),
                    fields,
                    params: this.causalParams
                })
            })
            const result = await res.json();
            if (result.success) {
                runInAction(() => {
                    this.causalStrength = result.data;
                })
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            notify({
                title: 'Causal Discovery Error',
                type: 'error',
                content: `${error}`
            })
        }
    }
    public async reRunCausalDiscovery () {
        const { cleanedData, fieldMetas } = this.dataSourceStore;
        this.causalDiscovery(cleanedData, fieldMetas);
    }
}