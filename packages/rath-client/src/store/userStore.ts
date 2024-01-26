import { makeAutoObservable, observable, runInAction } from 'mobx';
import {
    type ILoginForm,
    type IOrganization,
    type IUserInfo,
    type IWorkspace,
} from '../interfaces';
import { getMainServiceAddress } from '../utils/user';
import { notify } from '../components/error';
import { request } from '../utils/request';

interface ISignUpForm {
    userName: string;
    password: string;
    checkPassword: string;
    email: string;
    phone: string;
    certCode: string;
    invCode: string;
}

export default class UserStore {
    public login!: ILoginForm;
    public signup!: ISignUpForm;
    public initialized = false;
    public isLoggedIn = false;
    public info: IUserInfo | null = null;
    public get loggedIn() {
        return this.info !== null;
    }
    public get userName() {
        return this.info?.userName ?? null;
    }

    /** Organization name */
    public currentOrgName: string | null = null;
    /** Workspace name */
    public currentWorkspaceName: string | null = null;

    public uploadDataSource: (() => void) | null = null;
    public uploadingDataSource = false;

    public get organization(): IOrganization | null {
        return this.info?.organizations?.find(org => org.name === this.currentOrgName) ?? null;
    }
    public get workspace(): IWorkspace | null {
        return this.organization?.workspaces?.find(wsp => wsp.name === this.currentWorkspaceName) ?? null;
    }

    protected effects: (() => void)[] = [];

    constructor() {
        makeAutoObservable(this, {
            uploadDataSource: observable.ref,
            // @ts-expect-error non-public fields
            effects: false,
        });
        this.init();
    }
    public init() {
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
        }
        this.info = null;
        this.effects = [];
    }
    public destroy () {
        this.info = null;
        this.initialized = false;
        this.effects.splice(0, this.effects.length).forEach(disposer => disposer());
    }

    public logout() {
        this.destroy();
        this.init();
    }

    public async getPersonalInfo(): Promise<IUserInfo | null> {
        const url = getMainServiceAddress('/api/ce/personal');
        try {
            const result = await request.get<{}, IUserInfo>(url);
            if (result !== null) {
                const userInfo = {
                    userName: result.userName,
                    eduEmail: result.eduEmail,
                    email: result.email,
                    phone: result.phone,
                    avatarURL: result.avatarURL,
                };
                runInAction(() => {
                    this.info = userInfo;
                    this.getOrganizations();
                });
                return userInfo;
            }
        } catch (error) {
            notify({
                title: '[/api/ce/personal]',
                type: 'error',
                content: `${error}`,
            });
        }
        return null;
    }

    protected async getOrganizations() {
        const url = getMainServiceAddress('/api/ce/organization/list');
        try {
            const result = await request.get<{}, { organization: readonly Omit<IOrganization, 'workspaces'>[] }>(url);
            runInAction(() => {
                this.info!.organizations = result.organization;
            });
        } catch (error) {
            notify({
                title: '[/api/ce/organization/list]',
                type: 'error',
                content: `${error}`,
            });
        }
    }

    public async getWorkspaces(organizationName: string) {
        const which = this.info?.organizations?.find(org => org.name === organizationName);
        if (!which || which.workspaces !== undefined) {
            return null;
        }
        const url = getMainServiceAddress('/api/ce/organization/workspace/list');
        try {
            const result = await request.get<{ organizationName: string }, { workspaceList: Omit<IWorkspace, 'notebooks' | 'datasets'>[] }>(url, {
                organizationName,
            });
            runInAction(() => {
                which.workspaces = result.workspaceList;
            });
            return result.workspaceList;
        } catch (error) {
            notify({
                title: '[/api/ce/organization/workspace/list]',
                type: 'error',
                content: `${error}`,
            });
            return null;
        }
    }

    public setOrgId(orgId: string | null): boolean {
        const org = this.info?.organizations?.find(which => which.id === orgId);
        if (!org) {
            this.currentOrgName = null;
            return false;
        }
        this.currentOrgName = org.name;
        const wsp = org.workspaces?.find(which => which.name === this.currentWorkspaceName);
        if (!wsp) {
            this.currentWorkspaceName = null;
        }
        return true;
    }

    public setWspName(wspName: string | null) {
        this.currentWorkspaceName = wspName;
    }

}
