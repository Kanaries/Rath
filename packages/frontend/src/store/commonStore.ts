import { makeAutoObservable } from 'mobx';
import { COMPUTATION_ENGINE, PIVOT_KEYS } from '../constants';

export class CommonStore {
    public appKey: string = PIVOT_KEYS.dataSource;
    public computationEngine: string = COMPUTATION_ENGINE.webworker;
    constructor() {
        makeAutoObservable(this);
    }
    public setAppKey (key: string) {
        this.appKey = key
    }
    public setComputationEngine(engine: string) {
        this.computationEngine = engine;
    }
}
