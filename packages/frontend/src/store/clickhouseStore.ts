import { makeAutoObservable, observable, runInAction } from "mobx";
import { IDBFieldMeta, IRawField, IRow } from "../interfaces";
import { dbDataType2DataType, inferAnalyticTypeFromDataType, inferSemanticTypeFromDataType } from "../utils";
const CH_CONGIH = {
    connectorURL: 'https://localhost:2333'
}
export class ClickHouseStore {
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
    public async loadDBList() {
        try {
            this.loadingDBs = true
            const res = await fetch(`${CH_CONGIH.connectorURL}/api/ch/dbs`);
            const result = await res.json();
            if (result.success) {
                runInAction(() => {
                    this.databases = result.data;
                    this.loadingDBs = false;
                })
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error(error);   
        }
    }
    public async loadViews(db: string) {
        try {
            this.loadingViews = true;
            const res = await fetch(`${CH_CONGIH.connectorURL}/api/ch/tables?dbName=${db}`);
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
            console.error(error)
        }
    }
    public async loadSampleData (): Promise<{ fieldMetas: IRawField[], data: IRow[] }> {
        try {
            const res = await fetch(`${CH_CONGIH.connectorURL}/api/ch/sampleData?dbName=${this.currentDB}&table=${this.currentView}`);
            const result = await res.json();
            if (result.success) {
                const { data, metas } = result.data as { data: IRow[], metas: IDBFieldMeta[]};
                const fieldMetas: IRawField[] = metas.map(f => {
                    const dataType = dbDataType2DataType(f.dataType);
                    return {
                        fid: f.fid,
                        dataType,
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
        } catch (error) {
            console.error(error)
        }
        return {
            fieldMetas: [],
            data: []
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