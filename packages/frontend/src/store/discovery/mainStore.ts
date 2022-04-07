import { makeAutoObservable } from "mobx";

interface ISetting {
    vizAlgo: 'lite' | 'strict'
}
export class DiscoveryMainStore {
    public settings: ISetting;
    public showSettings: boolean = false;
    constructor () {
        this.settings = {
            vizAlgo: 'lite'
        }
        makeAutoObservable(this);
    }
    public setShowSettings (show: boolean) {
        this.showSettings = show;
    }
    public updateSettings (skey: keyof ISetting, value: any) {
        this.settings[skey] = value;
    }
}