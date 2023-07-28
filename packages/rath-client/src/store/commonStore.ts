import { makeAutoObservable, observable, runInAction } from 'mobx';
import { Specification } from 'visual-insights';
import { COMPUTATION_ENGINE, EXPLORE_MODE, PIVOT_KEYS } from '../constants';
import { ITaskTestMode, IVegaSubset } from '../interfaces';
import { THEME_KEYS, prebuiltThemes } from '../queries/themes';
import { VegaGlobalConfig } from '../queries/themes/config';
import { destroyRathWorker, initRathWorker, rathEngineService } from '../services/index';
import { transVegaSubset2Schema } from '../utils/transform';
import { deepcopy } from '../utils';

export type ErrorType = 'error' | 'info' | 'success';
const TASK_TEST_MODE_COOKIE_KEY = 'task_test_mode';

export interface IThemeInfo {
    id: string;
    name: string;
    config: Record<string, any>;
    cover: {
        storageId: string;
        downloadUrl: string;
    };
    isFavorite: boolean;
    favoritesTotal: boolean;
    owner: string;
}

export type ThemeListResponse = {
    list: IThemeInfo[];
    count: number;
    pageSize: number;
    pageIndex: number;
};

export class CommonStore {
    public appKey: string = PIVOT_KEYS.connection;
    public computationEngine: string = COMPUTATION_ENGINE.webworker;
    public exploreMode: string = EXPLORE_MODE.comprehensive;
    public taskMode: ITaskTestMode = ITaskTestMode.local;
    public showStorageModal: boolean = false;
    public showAnalysisConfig: boolean = false;
    public navMode: 'text' | 'icon' = 'text';
    public graphicWalkerSpec: Specification;
    public vizSpec: IVegaSubset | null = null;
    public vizTheme: string = 'default';
    public customThemeConfig: VegaGlobalConfig | undefined = undefined;
    public themes: Record<string, VegaGlobalConfig | undefined> = { ...prebuiltThemes };
    public useCustomTheme: boolean = false;
    constructor() {
        const taskMode = localStorage.getItem(TASK_TEST_MODE_COOKIE_KEY) || ITaskTestMode.local;
        this.taskMode = taskMode as ITaskTestMode;
        this.graphicWalkerSpec = {};
        makeAutoObservable(this, {
            graphicWalkerSpec: observable.ref,
            vizSpec: observable.ref,
            customThemeConfig: observable.ref,
            themes: observable.shallow,
        });
    }
    public get themeConfig (): VegaGlobalConfig | undefined {
        return this.getTheme(this.vizTheme);
    }
    public getTheme(themeKey: string): VegaGlobalConfig | undefined {
        if (this.useCustomTheme) return this.customThemeConfig;
        // if (themeKey === THEME_KEYS.default) return undefined;
        if (themeKey === THEME_KEYS.default) return this.themes[THEME_KEYS.g2];
        return this.themes[themeKey];
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
    public setCustomThemeConfig (config: VegaGlobalConfig | undefined) {
        this.customThemeConfig = config;
    }
    public resetCustomThemeConfigByThemeKey (themeKey: string) {
        if (themeKey === THEME_KEYS.default || !this.themes[themeKey]) {
            this.customThemeConfig = undefined;
            return;
        }
        this.customThemeConfig = deepcopy(this.themes[themeKey]);
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
    public setShowStorageModal(show: boolean) {
        this.showStorageModal = show;
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
