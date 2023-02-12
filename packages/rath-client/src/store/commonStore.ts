import { IReactionDisposer, makeAutoObservable, observable, reaction, runInAction } from 'mobx';
import { Specification } from 'visual-insights';
import { COMPUTATION_ENGINE, EXPLORE_MODE, PIVOT_KEYS } from '../constants';
import { ITaskTestMode, IVegaSubset } from '../interfaces';
import { THEME_KEYS, visThemeParser } from '../queries/themes';
import { VegaThemeConfig } from '../queries/themes/config';
import { destroyRathWorker, initRathWorker, rathEngineService } from '../services/index';
import { transVegaSubset2Schema } from '../utils/transform';
import { deepcopy } from '../utils';
import { getMainServiceAddress } from '../utils/user';
import { request } from '../utils/request';
import { notify } from '../components/error';
import { getGlobalStore } from '.';

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
    data: IThemeInfo[];
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
    public subscribedThemeConfigs: Record<string, VegaThemeConfig | undefined> = {};
    public useCustomTheme: boolean = false;
    protected disposers: IReactionDisposer[];
    constructor() {
        const taskMode = localStorage.getItem(TASK_TEST_MODE_COOKIE_KEY) || ITaskTestMode.local;
        this.taskMode = taskMode as ITaskTestMode;
        this.graphicWalkerSpec = {};
        makeAutoObservable(this, {
            graphicWalkerSpec: observable.ref,
            vizSpec: observable.ref,
            customThemeConfig: observable.ref,
            subscribedThemeConfigs: observable.shallow,
        });
        this.disposers = [
            reaction(() => this.vizTheme, themeKey => {
                this.resetCustomThemeConfigByThemeKey(themeKey);
            }),
        ];
    }
    public destroy() {
        for (const dispose of this.disposers) {
            dispose();
        }
    }
    public get themeConfig (): VegaThemeConfig | undefined {
        if (this.useCustomTheme) return this.customThemeConfig;
        const subscribed = this.subscribedThemeConfigs[this.vizTheme];
        if (subscribed) {
            return subscribed;
        }
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
    public applyLoadedTheme (themeKey: string, config: VegaThemeConfig) {
        this.subscribedThemeConfigs[themeKey] = config;
        this.vizTheme = themeKey;
    }
    public setCustomThemeConfig (config: VegaThemeConfig | undefined) {
        this.customThemeConfig = config;
    }
    public resetCustomThemeConfigByThemeKey (themeKey: string) {
        if (themeKey === THEME_KEYS.default) this.customThemeConfig = undefined;
        this.customThemeConfig = deepcopy(this.subscribedThemeConfigs[this.vizTheme] ?? visThemeParser(this.vizTheme));
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
    public async getCloudThemes(): Promise<IThemeInfo[]> {
        const { userStore } = getGlobalStore();
        const { userName } = userStore;
        if (!userName) {
            return [];
        }
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
            list.push(...res.data);
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
            list.push(...res.data);
        } catch (error) {
            notify({
                title: '[/api/ce/theme/favorites/list]',
                type: 'error',
                content: `${error}`,
            });
        }
        return list;
    }
}
