import { makeAutoObservable, observable, runInAction } from 'mobx';
import { Specification } from 'visual-insights';
import { AVATAR_IMG_LIST, COMPUTATION_ENGINE, EXPLORE_MODE, PIVOT_KEYS } from '../constants';
import { IAccessPageKeys, IAVATAR_TYPES, ITaskTestMode, IVegaSubset } from '../interfaces';
import { clearLoginCookie, getAvatarURL, getServerUrl, setLoginCookie } from '../utils';
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
    public setNavMode(mode: 'text' | 'icon') {
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
                content: result.message,
                title: 'Error',
            });
            throw new Error(`${result.message}`);
        }
    }

    public async commitLogin() {
        try {
            const res = await commitLoginService(this.login);
            if (res) {
                setLoginCookie(this.login.userName);
                this.userName = this.login.userName;
            }
            return res;
        } catch (error) {
            // console.error(error);
            notify({
                title: '发生错误',
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
            console.log(res, 'Res');
            if (res) {
                clearLoginCookie();
                runInAction(() => {
                    this.userName = null;
                });
                notify({
                    title: '您已登出',
                    type: 'warning',
                    content: '您已登出，登出期间无法访问部分产品功能。',
                });
            } else {
                // throw '登出失败';
            }
        } catch (error) {
            notify({
                title: '发生错误',
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
            const url = getServerUrl('/api/ce/avatar');
            const res = await request.post<{ file?: File; isDefaultAvatar?: boolean }, { avatarURL: string }>(
                url,
                value
            );
            if (res) {
                this.info.avatar = res.avatarURL;
            }
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
