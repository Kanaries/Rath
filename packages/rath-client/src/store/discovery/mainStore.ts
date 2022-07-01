import { makeAutoObservable, runInAction } from "mobx";
import { IResizeMode } from "../../interfaces";

interface ISetting {
    vizAlgo: 'lite' | 'strict'
}
interface IMainVizSetting {
    interactive: boolean;
    debug: boolean;
    resize: {
        mode: IResizeMode;
        width: number;
        height: number;
    };
    nlg: boolean;
}
export class DiscoveryMainStore {
    public settings: ISetting;
    public showSettings: boolean = false;
    public mainVizSetting: IMainVizSetting;
    constructor () {
        this.mainVizSetting = {
            interactive: false,
            debug: false,
            resize: {
                mode: IResizeMode.auto,
                width: 320,
                height: 320,
            },
            nlg: false
        }
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
    public updateMainVizSettings (updater: (s: IMainVizSetting) => void) {
        runInAction(() => {
            updater(this.mainVizSetting);
        })
    }
}