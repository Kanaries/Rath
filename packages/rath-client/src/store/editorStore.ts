import { makeAutoObservable, observable } from "mobx";
import { IVisSpecType } from "../interfaces";
import { vs2vl } from "../queries/vegaSubset2VegaLite";

export class EditorStore {
    public baseSpecType!: IVisSpecType;
    public baseSpec: any | null;
    public muteSpec: any | null;
    public muteSpecType!: IVisSpecType;
    constructor () {
        this.init();
        makeAutoObservable(this, {
            baseSpec: observable.ref,
            muteSpec: observable.ref
        });
    }
    public init () {
        this.baseSpecType = IVisSpecType.vegaSubset;
        this.muteSpecType = IVisSpecType.vegaLite;
        this.baseSpec = null;
        this.muteSpec = null;
    }
    public syncSpec (visType: IVisSpecType, spec: any) {
        this.baseSpecType = visType;
        this.baseSpec = spec;
        this.muteSpecType = visType;
        this.muteSpec = vs2vl(spec);
    }
    public updateMuteSpec (spec: any) {
        this.muteSpec = spec;
    }
}