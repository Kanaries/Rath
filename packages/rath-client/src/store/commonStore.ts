import { makeAutoObservable, observable, runInAction } from 'mobx';
import { Specification } from 'visual-insights';
import { COMPUTATION_ENGINE, EXPLORE_MODE, PIVOT_KEYS } from '../constants';
import { ITaskTestMode, IVegaSubset } from '../interfaces';
import { THEME_KEYS, visThemeParser } from '../queries/themes';
import { VegaThemeConfig } from '../queries/themes/config';
import { destroyRathWorker, initRathWorker, rathEngineService } from '../services/index';
import { transVegaSubset2Schema } from '../utils/transform';
import { deepcopy } from '../utils';

export type ErrorType = 'error' | 'info' | 'success';
const TASK_TEST_MODE_COOKIE_KEY = 'task_test_mode';

export class CommonStore {
    public appKey: string = PIVOT_KEYS.dataSource;
    public computationEngine: string = COMPUTATION_ENGINE.webworker;
    public exploreMode: string = EXPLORE_MODE.comprehensive;
    public taskMode: ITaskTestMode = ITaskTestMode.local;
    public messages: Array<{ type: ErrorType; content: string }> = []; //[{type:'error', content: 'This is a test.'}];
    public showStorageModal: boolean = false;
    public showBackupModal: boolean = false;
    public showAnalysisConfig: boolean = false;
    public navMode: 'text' | 'icon' = 'text';
    public graphicWalkerSpec: Specification;
    public vizSpec: IVegaSubset | null = null;
    public vizTheme: string = 'default';
    public customThemeConfig: VegaThemeConfig | undefined = undefined;
    public useCustomTheme: boolean = false;
    constructor() {
        const taskMode = localStorage.getItem(TASK_TEST_MODE_COOKIE_KEY) || ITaskTestMode.local;
        this.taskMode = taskMode as ITaskTestMode;
        this.graphicWalkerSpec = {};
        makeAutoObservable(this, {
            graphicWalkerSpec: observable.ref,
            vizSpec: observable.ref,
            customThemeConfig: observable.ref
        });
    }
    public get themeConfig (): VegaThemeConfig | undefined {
        if (this.useCustomTheme) return this.customThemeConfig;
        if (this.vizTheme === THEME_KEYS.default) return undefined;
        return visThemeParser(this.vizTheme)
    }
    public setAppKey(key: string) {
        this.appKey = key;
    }
    public setUseCustomeTheme (use: boolean) {
        this.useCustomTheme = use;
    }
    public applyPreBuildTheme (themeKey: string) {
        this.vizTheme = themeKey;
    }
    public setCustomThemeConfig (config: VegaThemeConfig | undefined) {
        this.customThemeConfig = config;
    }
    public resetCustomThemeConfigByThemeKey (themeKey: string) {
        if (themeKey === THEME_KEYS.default) this.customThemeConfig = undefined;
        this.customThemeConfig = deepcopy(visThemeParser(this.vizTheme));
    }
    public showError(type: ErrorType, content: string) {
        this.messages.push({
            type,
            content,
        });
    }
    public visualAnalysisInGraphicWalker(spec: IVegaSubset) {
        this.graphicWalkerSpec = transVegaSubset2Schema(spec);
        this.appKey = PIVOT_KEYS.editor;
    }
    public analysisInPainter(spec: IVegaSubset) {
        this.vizSpec = spec;
        this.appKey = PIVOT_KEYS.painter;
    }
    public setNavMode (mode: 'text' | 'icon') {
        this.navMode = mode;
    }
    public setTaskTestMode(mode: ITaskTestMode) {
        this.taskMode = mode;
        localStorage.setItem(TASK_TEST_MODE_COOKIE_KEY, mode);
    }
    public setShowAnalysisConfig(show: boolean) {
        this.showAnalysisConfig = show;
    }
    public removeError(errIndex: number) {
        this.messages.splice(errIndex, 1);
    }
    public setShowStorageModal(show: boolean) {
        this.showStorageModal = show;
    }
    public setShowBackupModal(show: boolean) {
        this.showBackupModal = show;
    }
    public async setComputationEngine(engine: string) {
        try {
            destroyRathWorker();
            initRathWorker(engine);
            await rathEngineService({
                task: 'init',
                props: engine,
            });
            runInAction(() => {
                this.computationEngine = engine;
            });
        } catch (error) {
            // console.error(error);
        }
    }
    public async setExploreMode(mode: string) {
        this.exploreMode = mode;
    }
}
