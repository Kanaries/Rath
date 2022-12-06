import { makeAutoObservable, observable, runInAction } from 'mobx';
import { Specification } from 'visual-insights';
import { COMPUTATION_ENGINE, EXPLORE_MODE, PIVOT_KEYS } from '../constants';
import { IAccessPageKeys, ITaskTestMode, IVegaSubset } from '../interfaces';
import { getAvatarURL, getServerUrl, AVATAR_IMG_LIST, IAVATAR_TYPES } from '../utils/user';
import { destroyRathWorker, initRathWorker, rathEngineService } from '../services/index';
import { transVegaSubset2Schema } from '../utils/transform';
import { notify } from '../components/error';
import { request } from '../utils/request';
import { commitLoginService } from './fetch';

export type ErrorType = 'error' | 'info' | 'success';
const TASK_TEST_MODE_COOKIE_KEY = 'task_test_mode';

export interface ILoginForm {
    userName: string;
    password: string;
    email: string;
}

interface ISignUpForm {
    userName: string;
    password: string;
    checkPassword: string;
    email: string;
    phone: string;
    certCode: string;
    invCode: string;
}

interface IUserInfo {
    userName: string;
    email: string;
    eduEmail: string;
    phone: string;
    avatar: string;
}

const avatar_storage_key = 'avatar_storage_key';
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
    public login: ILoginForm;
    public signup: ISignUpForm;
    public userName: string | null = null;
    public info: IUserInfo = {
        userName: '',
        eduEmail: '',
        email: '',
        phone: '',
        avatar: '',
    };
    public avatarType: IAVATAR_TYPES = IAVATAR_TYPES.default;
    public avatarKey: string = localStorage.getItem(avatar_storage_key) || AVATAR_IMG_LIST[0];
    constructor() {
        this.login = {
            userName: '',
            password: '',
            email: '',
        };
        this.signup = {
            userName: '',
            password: '',
            checkPassword: '',
            email: '',
            phone: '',
            certCode: '',
            invCode: '',
        };
        const taskMode = localStorage.getItem(TASK_TEST_MODE_COOKIE_KEY) || ITaskTestMode.local;
        this.taskMode = taskMode as ITaskTestMode;
        this.graphicWalkerSpec = {};
        makeAutoObservable(this, {
            graphicWalkerSpec: observable.ref,
            vizSpec: observable.ref,
        });
    }
    public get avatarUrl(): string {
        const { avatarKey, avatarType, info } = this;
        return getAvatarURL({
            avatarKey,
            avatarType,
            email: info.email,
            size: 'small',
        });
    }
    public setAppKey(key: string) {
        this.appKey = key;
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

    public setAvatarConfig(at: IAVATAR_TYPES, ak: string) {
        this.avatarType = at;
        this.avatarKey = ak;
        localStorage.setItem(avatar_storage_key, ak);
    }

    public updateForm(formKey: IAccessPageKeys, fieldKey: keyof ILoginForm | keyof ISignUpForm, value: string) {
        if (fieldKey in this[formKey]) {
            // @ts-ignore
            this[formKey][fieldKey] = value;
        }
    }

    public async liteAuth(certMethod: 'email' | 'phone') {
        const url = getServerUrl('/api/liteAuth');
        const { certCode, phone, email } = this.signup;
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                certCode,
                certMethod,
                certAddress: certMethod === 'email' ? email : phone,
            }),
        });
        const result = await res.json();
        if (result.success) {
            notify({
                type: 'success',
                content: 'Login succeeded',
                title: 'Success',
            });
            runInAction(() => {
                this.userName = result.data;
            });
            return result.data;
        } else {
            notify({
                type: 'error',
                content: `${result.message}`,
                title: 'Error',
            });
            throw new Error(`${result.message}`);
        }
    }

    public async commitLogin() {
        try {
            const res = await commitLoginService(this.login);
            if (res) {
                this.userName = this.login.userName;
            }
            return res;
        } catch (error) {
            notify({
                title: 'Login error',
                type: 'error',
                content: `[/api/login] ${error}`,
            });
        }
    }

    public async commitLogout() {
        try {
            const url = getServerUrl('/api/logout');
            const res = await fetch(url, {
                method: 'GET',
            });
            if (res) {
                runInAction(() => {
                    this.userName = null;
                });
                notify({
                    title: 'Logout',
                    type: 'success',
                    content: 'Logout success!',
                });
            }
        } catch (error) {
            notify({
                title: 'logout error',
                type: 'error',
                content: `[/api/logout] ${error}`,
            });
        }
    }

    public async updateAuthStatus() {
        try {
            const url = getServerUrl('/api/loginStatus');
            const res = await request.get<{}, { loginStatus: boolean; userName: string }>(url);
            if (res.loginStatus && res.userName !== null) {
                runInAction(() => {
                    this.userName = res.userName;
                });
                return this.userName;
            }
            return null;
        } catch (error) {
            runInAction(() => {
                this.userName = null;
            });
            return null;
        }
    }
    public async getPersonalInfo() {
        const url = getServerUrl('/api/ce/personal');
        try {
            const result = await request.get<{}, IUserInfo>(url);
            if (result !== null) {
                runInAction(() => {
                    this.info.userName = result.userName;
                    this.info.eduEmail = result.eduEmail;
                    this.info.email = result.email;
                    this.info.phone = result.phone;
                });
            }
        } catch (error: any) {
            notify({
                title: '[/api/ce/personal]',
                type: 'error',
                content: error.toString(),
            });
        }
    }

    public async customAvatar(value: { file?: File; isDefaultAvatar?: boolean }) {
        try {
            const { file } = value;
            const data = new FormData();
            file && data.append('file', file);
            const url = getServerUrl('/api/ce/avatar');
            const res = await fetch(url, {
                method: 'POST',
                credentials: 'include',
                body: file ? data : JSON.stringify(value),
            });
            const result = await res.json();
            if (result.success) {
                this.info.avatar = result.data.avatarURL;
            }
            return result.success;
        } catch (error) {
            notify({
                title: 'Error',
                type: 'error',
                content: `[/api/ce/avatar] ${error}`,
            });
        }
    }

    public async getAvatarImgUrl() {
        const url = getServerUrl('/api/ce/avatar');
        try {
            const result = await request.get<{}, { avatarURL: string }>(url);
            if (result !== null) {
                runInAction(() => {
                    this.info.avatar = result.avatarURL;
                });
            }
        } catch (error: any) {
            notify({
                title: 'Error',
                type: 'error',
                content: `/api/ce/avatar ${error}`,
            });
        }
    }
}
