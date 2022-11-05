import { makeAutoObservable, observable, runInAction } from 'mobx';
import { notify } from '../components/error';
import { IFieldMeta, IRow } from '../interfaces';
import { CAUSAL_ALGORITHM_FORM, ICausalAlgorithm, makeFormInitParams, PC_PARAMS_FORM } from '../pages/causal/config';
import { causalService } from '../pages/causal/service';
// import { encodeDiscrete } from "../pages/causal/utils";
import { DataSourceStore } from './dataSourceStore';

// export interface ICausalParams {
//     algorithm?: ICausalAlgorithm; // | 'FCI' | 'CDNOD';
//     alpha?: number; //desired significance level (float) in (0, 1). Default: 0.05.
//     indep_test?: IndepenenceTest;
//     stable?: boolean; //run stabilized skeleton discovery if True. Default: True.
//     uc_rule?: UCRule;
//     uc_priority?: UCPriority;
//     mvpc?: boolean;
//     cat_encode_type?: ICatEncodeType;
//     keep_origin_cat?: boolean;
//     quant_encode_type?: IQuantEncodeType;
//     keep_origin_quant?: boolean;
// }

enum CausualServerUrl {
    local = 'http://localhost:8000',
    test = 'http://gateway.kanaries.cn:2080',
}
export class CausalStore {
    public igMatrix: number[][] = [];
    public igCondMatrix: number[][] = [];
    public causalStrength: number[][] = [];
    public computing: boolean = false;
    public showSettings: boolean = false;
    public focusNodeIndex: number = 0;
    public causalParams: { [key: string]: any } = {
        algorithm: ICausalAlgorithm.PC,
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
    };
    private dataSourceStore: DataSourceStore;
    constructor(dataSourceStore: DataSourceStore) {
        this.dataSourceStore = dataSourceStore;
        this.causalParams = makeFormInitParams(PC_PARAMS_FORM);
        this.causalParams['algorithm'] = ICausalAlgorithm.PC;
        makeAutoObservable(this, {
            causalStrength: observable.ref,
            igMatrix: observable.ref,
            igCondMatrix: observable.ref,
            // @ts-ignore
            dataSourceStore: false,
        });
    }
    public switchCausalAlgorithm(algorithm: ICausalAlgorithm) {
        this.causalParams = makeFormInitParams(CAUSAL_ALGORITHM_FORM[algorithm]);
        this.causalParams['algorithm'] = algorithm;
    }
    public updateCausalParamsValue(key: string, value: any) {
        this.causalParams[key] = value;
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
    public async causalDiscovery(dataSource: IRow[], fields: IFieldMeta[]) {
        try {
            const res = await fetch(`${CausualServerUrl.local}/causal/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    dataSource, // encodeDiscrte(dataSource, fields),
                    fields,
                    params: this.causalParams,
                }),
            });
            const result = await res.json();
            if (result.success) {
                runInAction(() => {
                    this.causalStrength = result.data;
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
        }
    }
    public async reRunCausalDiscovery() {
        const { cleanedData, fieldMetas } = this.dataSourceStore;
        this.causalDiscovery(cleanedData, fieldMetas);
    }
}
