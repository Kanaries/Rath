import { makeAutoObservable, runInAction } from 'mobx';
import { COMPUTATION_ENGINE, PIVOT_KEYS } from '../constants';
import { destroyRathWorker, initRathWorker, rathEngineService } from '../service';

export type ErrorType = 'error' | 'info' | 'success';
export class CommonStore {
    public appKey: string = PIVOT_KEYS.dataSource;
    public computationEngine: string = COMPUTATION_ENGINE.webworker;
    public messages: Array<{type: ErrorType, content: string}> = []; //[{type:'error', content: 'This is a test.'}];
    public showStorageModal: boolean = false;
    constructor() {
        makeAutoObservable(this);
    }
    public setAppKey (key: string) {
        this.appKey = key
    }
    public showError (type: ErrorType, content: string) {
        this.messages.push({
            type,
            content
        })
    }
    public removeError (errIndex: number) {
        this.messages.splice(errIndex, 1);
    }
    public setShowStorageModal (show: boolean) {
        this.showStorageModal = show;
    }
    public async setComputationEngine(engine: string) {
        try {
            destroyRathWorker();
            initRathWorker(engine);
            await rathEngineService({
                task: 'init',
                props: engine
            })
            runInAction(() => {
                this.computationEngine = engine;
            })
        } catch (error) {
            console.error(error);
        }
    }
}
