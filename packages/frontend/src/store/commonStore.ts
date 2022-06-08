import { makeAutoObservable, runInAction } from 'mobx';
import { COMPUTATION_ENGINE, EXPLORE_MODE, PIVOT_KEYS } from '../constants';
import { ITaskTestMode } from '../interfaces';
import { destroyRathWorker, initRathWorker, rathEngineService } from '../service';

export type ErrorType = 'error' | 'info' | 'success';
const TASK_TEST_MODE_COOKIE_KEY = 'task_test_mode'
export class CommonStore {
    public appKey: string = PIVOT_KEYS.dataSource;
    public computationEngine: string = COMPUTATION_ENGINE.webworker;
    public exploreMode: string = EXPLORE_MODE.comprehensive;
    public taskMode: ITaskTestMode = ITaskTestMode.local;
    public messages: Array<{type: ErrorType, content: string}> = []; //[{type:'error', content: 'This is a test.'}];
    public showStorageModal: boolean = false;
    public showAnalysisConfig: boolean = false;
    constructor() {
        const taskMode = localStorage.getItem(TASK_TEST_MODE_COOKIE_KEY) || ITaskTestMode.local;
        this.taskMode = taskMode as ITaskTestMode;
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
    public setTaskTestMode (mode: ITaskTestMode) {
        this.taskMode = mode;
        localStorage.setItem(TASK_TEST_MODE_COOKIE_KEY, mode)
    }
    public setShowAnalysisConfig (show: boolean) {
        this.showAnalysisConfig = show;
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
    public async setExploreMode(mode: string) {
        this.exploreMode = mode;
    }
}
