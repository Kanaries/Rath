import { makeAutoObservable, observable, runInAction } from "mobx";
import { notify } from "../components/error";
import { IECStatus, IDBFieldMeta, IRawField, IRow } from "../interfaces";
import { dbDataType2DataType, inferAnalyticTypeFromDataType, inferSemanticTypeFromDataType } from "../utils";

interface IProxyConfig {
    host: string;
    protocol: string;
    port: string;
}
interface CHConfig {
    user: string;
    password: string;
    protocol: string; //'http' | 'https';
    host: string;
    port: string//number
}
export class ClickHouseStore {
    public config: CHConfig = {
        user: 'default',
        password: '',
        protocol: 'https',
        host: 'localhost',
        port: '2333'
    }
    public proxyConfig: IProxyConfig = {
        host: 'localhost',
        protocol: 'https',
        port: '2333',
    }
    public chConnected: boolean = false;
    public connectStatus: IECStatus = 'client';
    public databases: string[] = [];
    public viewNames: string[] = [];
    public currentDB: string | null = null;
    public currentView: string | null = null;
    public loadingDBs: boolean = false;
    public loadingViews: boolean = false;
    public fieldMetas: IRawField[] = [];
    public sampleData: IRow[] = [];
    public enableComputationEngine: boolean = false;
    constructor () {
        makeAutoObservable(this, {
            fieldMetas: observable.ref,
            sampleData: observable.ref
        });
    }
    public setConfig (_key: keyof CHConfig, value: any) {
        this.config[_key] = value;
    }
    public setProxyConfig(_key: keyof IProxyConfig, value: any) {
        this.proxyConfig[_key] = value;
    }
    private getProxyURL() {
        const { proxyConfig } = this;
        return `${proxyConfig.protocol}://${proxyConfig.host}:${proxyConfig.port}`;
    }
    public async getDefaultConfig () {
        try {
            const res = await fetch(`${this.getProxyURL()}/api/config/connection`);
            const result = await res.json();
            if (result.success) {
                runInAction(() => {
                    const ckc = result.data.clickhouse;
                    this.config.host = ckc.host;
                    this.config.port = `${ckc.port}`;
                    this.config.protocol = ckc.protocol;
                    this.config.password = ckc.password;
                    this.config.user = ckc.user;
                })
            } else {
                throw new Error(result.message)
            }
        } catch (error) {
            throw new Error(`[getconfig]${error}`);
        }
    }
    public async testConnection () {
        try {
            const { user, password, host, port, protocol } = this.config;
            const res = await fetch(`${this.getProxyURL()}/connect`, {
                method: 'post',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user, password, host, port, protocol
                })
            })
            const result = await res.json();
            if (result.success) {
                runInAction(() => {
                    this.connectStatus = 'engine';
                })
            } else {
                runInAction(() => {
                    this.connectStatus = 'proxy';
                })
            }
        } catch (error) {
            runInAction(() => {
                this.connectStatus = 'client'
            })
            throw new Error('OLAP Service Connection Error');
        }
    }
    public async loadDBList() {
        try {
            this.loadingDBs = true
            const res = await fetch(`${this.getProxyURL()}/api/ch/dbs`);
            const result = await res.json();
            if (result.success) {
                runInAction(() => {
                    this.databases = result.data;
                    this.loadingDBs = false;
                })
            } else {
                throw new Error(result.message);
            }
        } catch (error: any) {
            runInAction(() => {
                this.databases = []
                this.loadingDBs = false;
            })
            throw new Error(`[ClickHouse] Load DB List: ${error.toString()}`);
        }
    }
    public async loadViews(db: string) {
        try {
            this.loadingViews = true;
            const res = await fetch(`${this.getProxyURL()}/api/ch/tables?dbName=${db}`);
            const result = await res.json();
            if (result.success) {
                runInAction(() => {
                    this.viewNames = result.data;
                    this.loadingViews = false;
                })
            } else {
                throw new Error(result.message)
            }
        } catch (error) {
            runInAction(() => {
                this.loadingViews = false;
            })
            notify({
                title: 'CK Load Views Error',
                type: 'error',
                content: `clickhouse load views error.\n${error}`
            })
        }
    }
    /**
     * 获取采样数据
     * @returns 
     */
    public async loadSampleData (): Promise<{ fieldMetas: IRawField[], data: IRow[] }> {
        const res = await fetch(`${this.getProxyURL()}/api/ch/sampleData?dbName=${this.currentDB}&table=${this.currentView}`);
        const result = await res.json();
        if (result.success) {
            const { data, metas } = result.data as { data: IRow[], metas: IDBFieldMeta[]};
            const fieldMetas: IRawField[] = metas.map(f => {
                const dataType = dbDataType2DataType(f.dataType);
                return {
                    fid: f.fid,
                    name: f.fid,
                    dataType,
                    geoRole: 'none',
                    disable: false,
                    semanticType: inferSemanticTypeFromDataType(dataType),
                    analyticType: inferAnalyticTypeFromDataType(dataType)
                }
            });
            runInAction(() => {
                this.fieldMetas = fieldMetas
                this.sampleData = data
            })
            return {
                fieldMetas,
                data
            }
        } else {
            throw new Error(result.message)
        }
    }
    public async chooseDB (dbName: string) {
        this.currentDB = dbName;
        this.loadViews(dbName);
    }
    public chooseView (viewName: string) {
        this.currentView = viewName;
    }
}