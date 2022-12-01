import { runInAction } from "mobx";
import type { DataSourceStore } from "../dataSourceStore";
import CausalDatasetStore from "./datasetStore";
import CausalModelStore from "./modelStore";
import CausalOperatorStore from "./operatorStore";


export default class CausalStore {

    public readonly dataset: CausalDatasetStore;
    public readonly operator: CausalOperatorStore;
    public readonly model: CausalModelStore;

    public get fields() {
        return this.dataset.fields;
    }

    public get data() {
        return this.dataset.sample;
    }

    public destroy() {
        this.model.destroy();
        this.operator.destroy();
        this.dataset.destroy();
    }

    constructor(dataSourceStore: DataSourceStore) {
        this.dataset = new CausalDatasetStore(dataSourceStore);
        this.operator = new CausalOperatorStore(dataSourceStore);
        this.model = new CausalModelStore(this.dataset, this.operator);
    }

    public selectFields(...args: Parameters<CausalDatasetStore['selectFields']>) {
        this.dataset.selectFields(...args);
    }

    public appendFilter(...args: Parameters<CausalDatasetStore['appendFilter']>) {
        this.dataset.appendFilter(...args);
    }

    public removeFilter(...args: Parameters<CausalDatasetStore['removeFilter']>) {
        this.dataset.removeFilter(...args);
    }

    public async run() {
        runInAction(() => {
            this.model.causalityRaw = null;
            this.model.causality = null;
        });
        const result = await this.operator.causalDiscovery(
            this.dataset.sample,
            this.dataset.fields,
            this.model.functionalDependencies,
            this.model.assertionsAsPag,
        );
        runInAction(() => {
            this.model.causalityRaw = result?.raw ?? null;
            this.model.causality = result?.pag ?? null;
        });

        return result;
    }

}
