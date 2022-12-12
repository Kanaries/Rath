import { makeAutoObservable, observable, runInAction } from 'mobx';
import { IAccessPageKeys } from '../interfaces';
import { getMainServiceAddress } from '../utils/user';
import { notify } from '../components/error';
import { request } from '../utils/request';
import { commitLoginService } from './fetch';


export interface ILoginForm {
    userName: string;
    password: string;
    email: string;
}

export interface IWorkspace {
    readonly id: number;
    readonly name: string;
}

export interface IOrganization {
    readonly name: string;
    readonly id: number;
    workspaces: readonly IWorkspace[] | null;
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
    organizations?: readonly IOrganization[] | undefined;
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
        makeAutoObservable(this, {
            info: observable.shallow,
        });
    }

    public updateForm(formKey: IAccessPageKeys, fieldKey: keyof ILoginForm | keyof ISignUpForm, value: string) {
        if (fieldKey in this[formKey]) {
            // @ts-ignore
            this[formKey][fieldKey] = value;
        }
    }

    public async liteAuth(certMethod: 'email' | 'phone') {
        const url = getMainServiceAddress('/api/liteAuth');
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
            const url = getMainServiceAddress('/api/logout');
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
            const url = getMainServiceAddress('/api/loginStatus');
            const res = await request.get<{}, { loginStatus: boolean; userName: string }>(url);
            return res.loginStatus;
        } catch (error) {
            notify({
                title: '[/api/loginStatus]',
                type: 'error',
                content: `${error}${error instanceof Error ? error.stack : ''}`,
            });
            return false;
        }
    }

    public async getPersonalInfo() {
        const url = getMainServiceAddress('/api/ce/personal');
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
                    this.getOrganizations();
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

    protected async getOrganizations() {
        if (!this.info) {
            return;
        }
        const url = getMainServiceAddress('/api/ce/organization/list');
        try {
            const result = await request.get<{}, { organization: readonly IOrganization[] }>(url);
            this.info.organizations = result.organization;
        } catch (error) {
            notify({
                title: '[/api/ce/organization/list]',
                type: 'error',
                content: `${error}${error instanceof Error ? error.stack : ''}`,
            });
        }
    }

    public async getWorkspaces(organizationId: number) {
        const which = this.info?.organizations?.find(org => org.id === organizationId);
        if (!which || which.workspaces === null) {
            return null;
        }
        const url = getMainServiceAddress('/api/ce/organization/workspace/list');
        try {
            const result = await request.get<{ organizationId: number }, { workspaceList: IWorkspace[] }>(url, {
                organizationId,
            });
            which.workspaces = result.workspaceList;
        } catch (error) {
            notify({
                title: '[/api/ce/organization/workspace/list]',
                type: 'error',
                content: `${error}${error instanceof Error ? error.stack : ''}`,
            });
        }
    }

    public async uploadWorkspace(workspaceId: number, file: File) {
        const url = getMainServiceAddress('/api/ce/notebook');
        try {
            const { uploadUrl, id } = (await (await fetch(url, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: file.name,
                    type: 0,    // TODO: customize type of upload workspace
                    workspaceId,
                    fileType: file.type,
                    introduction: '',
                    size: file.size,
                }),
            })).json()).data;
            await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
            });
            await request.post<{ id: number }, {}>(getMainServiceAddress('/api/ce/notebook/callback'), { id });
        } catch (error) {
            notify({
                title: '[/api/ce/notebook]',
                type: 'error',
                content: `${error}${error instanceof Error ? error.stack : ''}`,
            });
        }
    }

}
