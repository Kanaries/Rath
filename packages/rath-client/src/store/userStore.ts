import { makeAutoObservable, observable, runInAction } from 'mobx';
import { TextWriter, ZipReader } from "@zip.js/zip.js";
import { DataSourceType, IAccessPageKeys, ICreateDashboardConfig, ICreateDatasetPayload, ICreateDatasetResult, ICreateDataSourcePayload, ICreateDataSourceResult, IDashboardDocumentInfo, IDatasetData, IDatasetMeta, IDataSourceMeta } from '../interfaces';
import { getMainServiceAddress } from '../utils/user';
import { notify } from '../components/error';
import { request } from '../utils/request';
import { KanariesDatasetFilenameCloud } from '../constants';
import { IKRFComponents, IParseMapItem } from '../utils/download';
import { commitLoginService } from './fetch';
import { getGlobalStore } from '.';

export interface ILoginForm {
    userName: string;
    password: string;
    email: string;
}

export interface INotebook {
    readonly id: string;
    readonly name: string;
    readonly size: number;
    readonly createAt: number;
    readonly downLoadURL: string;
}

export interface IWorkspace {
    readonly id: string;
    readonly name: string;
    datasets?: readonly IDatasetMeta[] | null | undefined;
    notebooks?: readonly INotebook[] | null | undefined;
}

export interface IOrganization {
    readonly name: string;
    readonly id: string;
    workspaces?: readonly IWorkspace[] | null | undefined;
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
    avatarURL: string;
    organizations?: readonly IOrganization[] | undefined;
}

export default class UserStore {
    public login!: ILoginForm;
    public signup!: ISignUpForm;
    public info: IUserInfo | null = null;
    public saving = false;
    public get loggedIn() {
        return this.info !== null;
    }
    public get userName() {
        return this.info?.userName ?? null;
    }

    /** Storage meta on cloud. */
    public cloudDataSourceMeta: IDataSourceMeta | null = null;
    /** Dataset storage meta on cloud. */
    public cloudDatasetMeta: IDatasetMeta | null = null;
    /** Organization name */
    public currentOrgName: string | null = null;
    /** Workspace name */
    public currentWspName: string | null = null;

    public uploadDataSource: (() => void) | null = null;
    public uploadingDataSource = false;

    public get organization(): IOrganization | null {
        return this.info?.organizations?.find(org => org.name === this.currentOrgName) ?? null;
    }
    public get workspace(): IWorkspace | null {
        return this.organization?.workspaces?.find(wsp => wsp.name === this.currentWspName) ?? null;
    }

    constructor() {
        this.init()
        makeAutoObservable(this, {
            uploadDataSource: observable.ref,
            // @ts-expect-error non-public fields
            autoSaveTimer: false,
            waitList: false,
            disposers: false,
        });
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
    }
    public destroy () {
        this.info = null;
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

    /** @deprecated this method won't work because Rath cannot change the cookie set by Kanaries Home */
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
                content: `${error}`,
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
                        avatarURL: result.avatarURL,
                    };
                    this.getOrganizations();
                });
            }
        } catch (error) {
            notify({
                title: '[/api/ce/personal]',
                type: 'error',
                content: `${error}`,
            });
        }
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

    public async getNotebooksAndDatasets(organizationName: string, workspaceName: string, forceUpdate = false) {
        const which = this.info?.organizations?.find(org => org.name === organizationName)?.workspaces?.find(wsp => wsp.name === workspaceName);
        if (!which) {
            return null;
        }
        if (!forceUpdate && which.notebooks !== undefined) {
            return null;
        }
        const listNotebookApiUrl = getMainServiceAddress('/api/ce/notebook/list');
        const listDatasetApiUrl = getMainServiceAddress('/api/ce/dataset/list');
        try {
            const result = await Promise.allSettled([
                request.get<{ workspaceName: string }, { notebookList: INotebook[] }>(listNotebookApiUrl, {
                    workspaceName,
                }),
                request.get<{ workspaceName: string }, { datasetList: IDatasetMeta[] }>(listDatasetApiUrl, {
                    workspaceName,
                })
            ]).then(([notebookRes, datasetRes]) => ({
                notebooks: notebookRes.status === 'fulfilled' ? notebookRes.value.notebookList : [],
                datasets: datasetRes.status === 'fulfilled' ? datasetRes.value.datasetList : [],
                errInfo: [
                    notebookRes.status === 'rejected' ? notebookRes.reason : null,
                    datasetRes.status === 'rejected' ? datasetRes.reason : null,
                ].filter(reason => reason !== null),
            }));
            for (const errInfo of result.errInfo) {
                notify({
                    title: '[getNotebooksAndDatasets]',
                    type: 'error',
                    content: `${errInfo}`,
                });
            }
            if (result.errInfo.length > 0) {
                return null;
            }
            runInAction(() => {
                which.notebooks = result.notebooks;
                which.datasets = result.datasets;
            });
            return result;
        } catch (error) {
            notify({
                title: '[getNotebooksAndDatasets]',
                type: 'error',
                content: `${error}`,
            });
            return null;
        }
    }

    public async uploadNotebook(workspaceName: string, file: File) {
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
                    workspaceName,
                    fileType: file.type,
                    introduction: '',
                    size: file.size,
                }),
            })).json()).data;
            await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
            });
            await request.post<{ id: string }, {}>(getMainServiceAddress('/api/ce/notebook/callback'), { id });
            return true;
        } catch (error) {
            notify({
                title: '[/api/ce/notebook]',
                type: 'error',
                content: `${error}`,
            });
            return false;
        }
    }

    public async openDataset(dataset: IDatasetMeta): Promise<boolean> {
        const { downloadUrl, datasource, id, workspace } = dataset;
        try {
            const data = await fetch(downloadUrl, { method: 'GET' });
            if (!data.ok) {
                throw new Error(data.statusText);
            }
            if (!data.body) {
                throw new Error('Request got empty body');
            }
            const ok = await this.loadDataset(data.body, dataset.organization.name, workspace.name, datasource.id, id);
            if (ok) {
                const etUrl = getMainServiceAddress('/api/ce/tracing/normal');
                try {
                    await fetch(etUrl, {
                        method: 'POST',
                        credentials: 'include',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            eventTime: Date.now(),
                            eventType: 'datasetUsage',
                            eventLabel: 'rath',
                            eventValue1: dataset.id,
                        }),
                    });
                } catch (error) {
                    console.warn('EventTrack error <report dataset use>', error);
                }
            }
            return ok;
        } catch (error) {
            notify({
                type: 'error',
                title: '[openDataset]',
                content: `${error}`,
            });
            return false;
        }
    }

    public async loadDataset(
        body: ReadableStream<Uint8Array> | File,
        organizationName: string | null,
        workspaceName: string,
        dataSourceId: string,
        datasetId: string
    ): Promise<boolean> {
        const { dataSourceStore } = getGlobalStore();
        try {
            const zipReader = new ZipReader(body instanceof File ? body.stream() : body);
            const file = (await zipReader.getEntries()).find(entry => entry.filename === KanariesDatasetFilenameCloud);
            if (!file) {
                throw new Error('Dataset file not found');
            }
            const writer = new TextWriter();
            const dataset = JSON.parse(await file.getData(writer)) as IDatasetData;
            await dataSourceStore.loadBackupDataStore(dataset.data, dataset.meta);
            const dataSource = await this.fetchDataSource(workspaceName, dataSourceId, true);
            if (dataSource && organizationName) {
                this.setCloudDataSource(dataSource, organizationName, workspaceName);
                const cloudMeta = await this.fetchDataset(workspaceName, datasetId);
                if (cloudMeta) {
                    this.setCloudDataset(cloudMeta);
                }
            }
            return true;
        } catch (error) {
            notify({
                type: 'error',
                title: '[loadDataset]',
                content: `${error}`,
            });
            return false;
        }
    }

    public async fetchDataSource(workspaceName: string, dataSourceId: string, silent = false): Promise<IDataSourceMeta | null> {
        const dataSourceApiUrl = getMainServiceAddress('/api/ce/datasource');
        try {
            const dataSourceDetail = await request.get<{
                workspaceName: string;
                datasourceId: string;
            }, IDataSourceMeta>(dataSourceApiUrl, { datasourceId: dataSourceId, workspaceName });
            return dataSourceDetail;
        } catch (error) {
            const info = {
                type: 'error',
                title: '[fetchDataSource]',
                content: `${error}`,
            } as const;
            if (silent) {
                console.warn(info);
            } else {
                notify(info);
            }
            return null;
        }
    }

    public async fetchDataset(workspaceName: string, datasetId: string): Promise<IDatasetMeta | null> {
        const dataSourceApiUrl = getMainServiceAddress('/api/ce/dataset');
        try {
            const dataSourceDetail = await request.get<{
                workspaceName: string;
                datasetId: string;
            }, Omit<IDatasetMeta, 'workspaceName'>>(dataSourceApiUrl, { datasetId, workspaceName });
            return dataSourceDetail;
        } catch (error) {
            notify({
                type: 'error',
                title: '[fetchDataset]',
                content: `${error}`,
            });
            return null;
        }
    }

    public async openNotebook(downLoadURL: string) {
        try {
            const data = await fetch(downLoadURL, { method: 'GET' });
            if (!data.ok) {
                throw new Error(data.statusText);
            }
            if (!data.body) {
                throw new Error('Request got empty body');
            }
            await this.loadNotebook(data.body);
        } catch (error) {
            notify({
                title: '[download notebook]',
                type: 'error',
                content: `${error}`,
            });
        }
    }

    public async loadNotebook(body: ReadableStream<Uint8Array> | File) {
        try {
            const zipReader = new ZipReader(body instanceof File ? body.stream() : body);
            const result = await zipReader.getEntries();
            const manifestFile = result.find((entry) => {
                return entry.filename === "parse_map.json";
            });
            if (!manifestFile) {
                throw new Error('Cannot find parse_map.json')
            }
            const writer = new TextWriter();
            const manifest = JSON.parse(await manifestFile.getData(writer)) as {
                items: IParseMapItem[];
                version: string;
            };
            const { dataSourceStore, causalStore, dashboardStore, collectionStore } = getGlobalStore();
            for await (const { name, key } of manifest.items) {
                const entry = result.find(which => which.filename === name);
                if (!entry || key === IKRFComponents.meta) {
                    continue;
                }
                const w = new TextWriter();
                try {
                    const res = await entry.getData(w);
                    switch (key) {
                        case IKRFComponents.data: {
                            const metaFile = manifest.items.find(item => item.type === IKRFComponents.meta);
                            if (!metaFile) {
                                break;
                            }
                            const meta = result.find(which => which.filename === metaFile.name);
                            if (!meta) {
                                break;
                            }
                            const wm = new TextWriter();
                            const rm = await meta.getData(wm);
                            await dataSourceStore.loadBackupDataStore(JSON.parse(res), JSON.parse(rm));
                            break;
                        }
                        case IKRFComponents.collection: {
                            collectionStore.loadBackup(JSON.parse(res));
                            break;
                        }
                        case IKRFComponents.causal: {
                            causalStore.load(JSON.parse(res));
                            break;
                        }
                        case IKRFComponents.dashboard: {
                            dashboardStore.loadAll(JSON.parse(res));
                            break;
                        }
                        default: {
                            break;
                        }
                    }
                } catch (error) {
                    notify({
                        title: 'Load Notebook Error',
                        type: 'error',
                        content: `${error}`,
                    });
                    continue;
                }
            }
        } catch (error) {
            notify({
                title: 'Load Notebook Error',
                type: 'error',
                content: `${error}`,
            });
        }
    }

    public async openDashboardTemplates(dashboards: IDashboardDocumentInfo[]): Promise<boolean> {
        const { dashboardStore } = getGlobalStore();
        for await (const dashboard of dashboards) {
            try {
                const dashboardData = await fetch(dashboard.downloadUrl, { method: 'GET' });
                if (!dashboardData.ok) {
                    throw new Error(dashboardData.statusText);
                }
                if (!dashboardData.body) {
                    throw new Error('Request got empty body');
                }
                const res = await dashboardData.json() as Parameters<(typeof dashboardStore)['loadPage']>[0];
                dashboardStore.loadPage(res, dashboard);
            } catch (error) {
                notify({
                    type: 'error',
                    title: '[fetchDashboardTemplate]',
                    content: `${error}`,
                });
                return false;
            } 
        }
        return true;
    }

    public async uploadDashboard(workspaceName: string, file: File, config: ICreateDashboardConfig): Promise<boolean> {
        const { dataSourceStore } = getGlobalStore();
        const { fieldMetas } = dataSourceStore;
        if (!this.cloudDataSourceMeta) {
            notify({
                type: 'error',
                title: '[uploadDashboard]',
                content: 'Data source is not uploaded',
            });
            return false;
        }
        const { id: datasourceId } = this.cloudDataSourceMeta;
        const createDashboardApiUrl = getMainServiceAddress('/api/ce/dashboard');
        const reportUploadSuccessApiUrl = getMainServiceAddress('/api/ce/upload/callback');
        try {
            const respond = await fetch(createDashboardApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                },
                body: JSON.stringify({
                    datasourceId,
                    datasetId: config.dashboard.bindDataset && this.cloudDatasetMeta ? this.cloudDatasetMeta.id : undefined,
                    workspaceName,
                    name: config.dashboard.name,
                    description: config.dashboard.description,
                    dashboardTemplate: {
                        name: config.dashboardTemplate.name,
                        description: config.dashboardTemplate.description,
                        meta: fieldMetas.map(f => ({
                            fId: f.fid,
                            description: config.dashboardTemplate.fieldDescription[f.fid] || f.name || '',
                            analyticType: f.analyticType,
                            semanticType: f.semanticType,
                        })),
                        size: file.size,
                        type: config.dashboardTemplate.publish ? 1 : 2,
                        cover: config.dashboardTemplate.cover ? {
                            name: config.dashboardTemplate.cover.name,
                            size: config.dashboardTemplate.cover.size,
                            type: config.dashboardTemplate.cover.type,
                        } : undefined,
                    },
                }),
            });
            if (!respond.ok) {
                throw new Error(respond.statusText);
            }
            const res = await respond.json() as {
                cover?: { uploadUrl: string; storage_id: string };
                dashboardTemplate: { uploadUrl: string; storageId: string };
            };
            if (config.dashboardTemplate.cover && res.cover?.uploadUrl) {
                const coverUploadRes = await fetch(res.cover.uploadUrl, {
                    method: 'PUT',
                    body: file,
                });
                if (!coverUploadRes.ok) {
                    throw new Error(`Failed to upload cover: ${coverUploadRes.statusText}`);
                }
                await request.get<{ storageId: string; status: 1 }, { downloadUrl: string }>(
                    reportUploadSuccessApiUrl, { storageId: res.cover.storage_id, status: 1 }
                );
            }
            const templateUploadRes = await fetch(res.dashboardTemplate.uploadUrl, {
                method: 'PUT',
                body: file,
            });
            if (!templateUploadRes.ok) {
                throw new Error(`Failed to upload file: ${templateUploadRes.statusText}`);
            }
            await request.get<{ storageId: string; status: 1 }, { downloadUrl: string }>(
                reportUploadSuccessApiUrl, { storageId: res.dashboardTemplate.storageId, status: 1 }
            );
            return true;
        } catch (error) {
            notify({
                type: 'error',
                title: '[uploadDashboard]',
                content: `${error}`,
            });
            return false;
        }
    }

    public setSaving(saving: boolean) {
        this.saving = saving;
    }

    public async saveDataSourceOnCloudOfflineMode(
        params: ICreateDataSourcePayload<'offline'>,
        file: File,
    ): Promise<{ id: string; downloadUrl: string } | null> {
        const send = async () => {
            if (!this.workspace || !this.organization || this.uploadingDataSource) {
                return null;
            }
            runInAction(() => {
                this.uploadingDataSource = true;
            });
            const createDataSourceApiUrl = getMainServiceAddress('/api/ce/datasource');
            const reportUploadSuccessApiUrl = getMainServiceAddress('/api/ce/upload/callback');
            try {
                const createDataSourceApiRes = await request.post<typeof params & { workspaceName: string }, ICreateDataSourceResult<'offline'>>(
                    createDataSourceApiUrl, {
                        ...params,
                        workspaceName: this.workspace.name,
                    }
                );
                if (params.datasourceType === DataSourceType.File) {
                    const fileUploadRes = await fetch(createDataSourceApiRes.fileInfo.uploadUrl, {
                        method: 'PUT',
                        body: file,
                    });
                    if (!fileUploadRes.ok) {
                        throw new Error(`Failed to upload file: ${fileUploadRes.statusText}`);
                    }
                    await request.get<{ storageId: string; status: 1 }, { downloadUrl: string }>(
                        reportUploadSuccessApiUrl, { storageId: createDataSourceApiRes.fileInfo.storageId, status: 1 }
                    );
                }
                const dataSource = await this.fetchDataSource(this.workspace.name, createDataSourceApiRes.id);
                if (!dataSource) {
                    throw new Error('Data source not existed');
                }
                this.setCloudDataSource(dataSource, this.organization.name, this.workspace.name);
                const fileUploadRes = await fetch(createDataSourceApiRes.fileInfo.uploadUrl, {
                    method: 'PUT',
                    body: file,
                });
                if (!fileUploadRes.ok) {
                    throw new Error(`Failed to upload file: ${fileUploadRes.statusText}`);
                }
                const reportUploadSuccessApiRes = await request.get<{ storageId: string; status: 1 }, { downloadUrl: string }>(
                    reportUploadSuccessApiUrl, { storageId: createDataSourceApiRes.fileInfo.storageId, status: 1 }
                );
                runInAction(() => {
                    this.uploadingDataSource = false;
                });
                return {
                    id: createDataSourceApiRes.id,
                    downloadUrl: reportUploadSuccessApiRes.downloadUrl,
                };
            } catch (error) {
                notify({
                    type: 'error',
                    title: '[saveDataSourceOnCloud]',
                    content: `${error}`,
                });
                runInAction(() => {
                    this.uploadingDataSource = false;
                });
                return null;
            }
        };
        if (this.organization && this.workspace && !this.uploadingDataSource) {
            return send();
        }
        this.uploadDataSource = () => {
            if (this.organization && this.workspace && !this.uploadingDataSource) {
                send().then(res => {
                    if (res) {
                        this.uploadDataSource = null;
                    }
                });
            }
        };
        return null;
    }

    public async saveDataSourceOnCloudOnlineMode(
        params: ICreateDataSourcePayload<'online'>,
    ): Promise<{ id: string } | null> {
        const send = async () => {
            if (!this.workspace || !this.organization || this.uploadingDataSource) {
                return null;
            }
            runInAction(() => {
                this.uploadingDataSource = true;
            });
            const createDataSourceApiUrl = getMainServiceAddress('/api/ce/datasource');
            try {
                const createDataSourceApiRes = await request.post<typeof params & { workspaceName: string }, ICreateDataSourceResult<'online'>>(
                    createDataSourceApiUrl, {
                        ...params,
                        workspaceName: this.workspace.name,
                    }
                );
                const dataSource = await this.fetchDataSource(this.workspace.name, createDataSourceApiRes.id);
                if (!dataSource) {
                    throw new Error('Data source not existed');
                }
                this.setCloudDataSource(dataSource, this.organization.name, this.workspace.name);
                runInAction(() => {
                    this.uploadingDataSource = false;
                });
                return { id: createDataSourceApiRes.id };
            } catch (error) {
                notify({
                    type: 'error',
                    title: '[saveDataSourceOnCloud]',
                    content: `${error}`,
                });
                runInAction(() => {
                    this.uploadingDataSource = false;
                });
                return null;
            }
        };
        if (this.organization && this.workspace && !this.uploadingDataSource) {
            return send();
        }
        this.uploadDataSource = () => {
            if (this.organization && this.workspace && !this.uploadingDataSource) {
                send().then(res => {
                    if (res) {
                        this.uploadDataSource = null;
                    }
                });
            }
        };
        return null;
    }

    public async saveDatasetOnCloud(payload: ICreateDatasetPayload, file: File) {
        const { userStore } = getGlobalStore();
        const createDatasetApiUrl = getMainServiceAddress('/api/ce/dataset');
        const reportUploadSuccessApiUrl = getMainServiceAddress('/api/ce/upload/callback');
        try {
            const respond = await fetch(createDatasetApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                },
                credentials: 'include',
                body: JSON.stringify(payload),
            });
            if (!respond.ok) {
                throw new Error(respond.statusText);
            }
            const createDatasetApiRes = await respond.json() as (
                | { success: false; message: string }
                | { success: true; data: ICreateDatasetResult }
            );
            if (!createDatasetApiRes.success) {
                throw new Error(createDatasetApiRes.message);
            }
            const fileUploadRes = await fetch(createDatasetApiRes.data.uploadUrl, {
                method: 'PUT',
                body: file,
            });
            if (!fileUploadRes.ok) {
                throw new Error(`Failed to upload file: ${fileUploadRes.statusText}`);
            }
            const reportUploadSuccessApiRes = await request.get<{ storageId: string; status: 1 }, { downloadUrl: string }>(
                reportUploadSuccessApiUrl, { storageId: createDatasetApiRes.data.storageId, status: 1 }
            );
            const dataset = await userStore.fetchDataset(payload.workspaceName, createDatasetApiRes.data.datasetId);
            if (!dataset) {
                throw new Error('Dataset not existed');
            }
            this.setCloudDataset(dataset);
            return reportUploadSuccessApiRes;
        } catch (error) {
            notify({
                type: 'error',
                title: '[saveDatasetOnCloud]',
                content: `${error}`,
            });
            return null;
        }
    }

    public setCloudDataset(dataset: IDatasetMeta) {
        this.cloudDatasetMeta = dataset;
        this.currentOrgName = dataset.organization.name;
        this.currentWspName = dataset.workspace.name;
    }

    public setCloudDataSource(dataSource: IDataSourceMeta, organizationName?: string, workspaceName?: string) {
        this.cloudDataSourceMeta = dataSource;
        if (organizationName) {
            this.currentOrgName = organizationName;
        }
        if (workspaceName) {
            this.currentWspName = workspaceName;
        }
    }

    public setOrgName(orgName: string | null): boolean {
        const org = this.info?.organizations?.find(which => which.name === orgName);
        if (!org) {
            this.currentOrgName = null;
            return false;
        }
        this.currentOrgName = orgName;
        const wsp = org.workspaces?.find(which => which.name === this.currentWspName);
        if (!wsp) {
            this.currentWspName = null;
        }
        return true;
    }

    public setWspName(wspName: string | null) {
        this.currentWspName = wspName;
    }

}
