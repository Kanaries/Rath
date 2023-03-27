import { makeAutoObservable, observable, runInAction } from 'mobx';
import { Specification } from 'visual-insights';
import { COMPUTATION_ENGINE, EXPLORE_MODE, PIVOT_KEYS } from '../constants';
import { ITaskTestMode, IVegaSubset } from '../interfaces';
import { THEME_KEYS, prebuiltThemes } from '../queries/themes';
import { VegaThemeConfig } from '../queries/themes/config';
import { destroyRathWorker, initRathWorker, rathEngineService } from '../services/index';
import { transVegaSubset2Schema } from '../utils/transform';
import { deepcopy } from '../utils';
import { getMainServiceAddress } from '../utils/user';
import { request } from '../utils/request';
import { notify } from '../components/error';

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

interface IWorkspaceSimpleInfo {
    name: string;
    organization: {
        name: string;
    };
}

export class CommonStore {
    public appKey: string = PIVOT_KEYS.connection;
    public computationEngine: string = COMPUTATION_ENGINE.webworker;
    public exploreMode: string = EXPLORE_MODE.comprehensive;
    public taskMode: ITaskTestMode = ITaskTestMode.local;
    public showStorageModal: boolean = false;
    public showBackupModal: boolean = false;
    public showAnalysisConfig: boolean = false;
    public navMode: 'text' | 'icon' = 'text';
    public graphicWalkerSpec: Specification;
    public vizSpec: IVegaSubset | null = null;
    public vizTheme: string = 'default';
    public customThemeConfig: VegaThemeConfig | undefined = undefined;
    public themes: Record<string, VegaThemeConfig | undefined> = { ...prebuiltThemes };
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
    public get themeConfig (): VegaThemeConfig | undefined {
        return this.getTheme(this.vizTheme);
    }
    public getTheme(themeKey: string): VegaThemeConfig | undefined {
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
    public setCustomThemeConfig (config: VegaThemeConfig | undefined) {
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
    public async getCloudThemes(userName: string): Promise<IThemeInfo[]> {
        const workspaceUrl = getMainServiceAddress("/api/ce/simpleInfo/workspace");
        let workspaceName: string;
        try {
            const result = await request.get<{ userName: string }, IWorkspaceSimpleInfo>(workspaceUrl, { userName });
            workspaceName = result.name;
        } catch (error) {
            notify({
                title: '[/api/ce/simpleInfo/workspace]',
                type: 'error',
                content: `${error}`,
            });
            return [];
        }
        const list: IThemeInfo[] = [];
        const personalUrl = getMainServiceAddress('/api/ce/theme/list');
        try {
            const res = await request.get<{ workspaceName: string }, ThemeListResponse>(
                personalUrl,
                { workspaceName }
            );
            list.push(...res.list);
        } catch (error) {
            notify({
                title: '[/api/ce/theme/list]',
                type: 'error',
                content: `${error}`,
            });
        }
        const collectionUrl = getMainServiceAddress('/api/ce/theme/favorites/list');
        try {
            const res = await request.get<{}, ThemeListResponse>(collectionUrl);
            list.push(...res.list);
        } catch (error) {
            notify({
                title: '[/api/ce/theme/favorites/list]',
                type: 'error',
                content: `${error}`,
            });
        }
        runInAction(() => {
            for (const theme of list) {
                // TODO: async config fetch
                this.themes[theme.name] = theme.config;
            }
        });
        return list;
    }
}
