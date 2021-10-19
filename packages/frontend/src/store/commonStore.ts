import { makeAutoObservable, runInAction } from 'mobx';
import { COMPUTATION_ENGINE, PIVOT_KEYS } from '../constants';
import { destroyRathWorker, initRathWorker, rathEngineService } from '../service';

export class CommonStore {
    public appKey: string = PIVOT_KEYS.dataSource;
    public computationEngine: string = COMPUTATION_ENGINE.webworker;
    constructor() {
        makeAutoObservable(this);
    }
    public setAppKey (key: string) {
        this.appKey = key
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
