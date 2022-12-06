import { makeAutoObservable, runInAction } from 'mobx';
import { IAccessPageKeys } from '../interfaces';
import { getServerUrl } from '../utils/user';
import { notify } from '../components/error';
import { request } from '../utils/request';
import { commitLoginService } from './fetch';


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
}

export default class UserStore {
    public login: ILoginForm;
    public signup: ISignUpForm;
    public info: IUserInfo | null = null;
    public get userName() {
        return this.info?.userName ?? null;
    }
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
        makeAutoObservable(this, {});
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
        const result = await res.json() as (
            | { success: true; data: boolean }
            | { success: false; message: string }
        );
        if (result.success) {
            notify({
                type: 'success',
                content: 'Login succeeded',
                title: 'Success',
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
                    this.info = null;
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
                return this.userName;
            }
            return null;
        } catch (error) {
            runInAction(() => {
                this.info = null;
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
                    this.info = {
                        userName: result.userName,
                        eduEmail: result.eduEmail,
                        email: result.email,
                        phone: result.phone,
                    };
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

}
