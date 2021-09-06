import { makeAutoObservable, observable, reaction, runInAction } from "mobx";
import { ISemanticType } from "visual-insights/build/esm/insights/InsightFlow/interfaces";
import { BIField, BIFieldType, Record } from "../global";
import { IFieldMeta, IRawField, IRow } from "../interfaces";
import { cleanData, CleanMethod } from "../pages/dataSource/clean";
import { getFieldsSummaryService } from "../service";
import { deepcopy, Transform } from "../utils";
import { fieldSummary2fieldMeta } from "../utils/transform";

// 关于dataSource里的单变量分析和pipeline整合的考虑：
// ds目前这里设置的是用户可能进行一定的数据类型定义，转换操作。用户此时关心的是单变量的信息，并不需要自动的触发后续流的计算，
// 所以这里不会干预主pipeline，是一个断层的解构。在用户完成设置之后，才会把它作为参数同步给pipeline。
// 但这并不意味着其不可以用stream的方式写，我们只需要把它放在流的缓存中，主流程在其他stream里即可(withLatestFrom)

export class DataSourceStore {
    /**
     * raw data is fetched and parsed data or uploaded data without any other changes.
     * computed value `dataSource` will be calculated
     */
    public rawData: IRow[] = [];
    /**
     * fields contains fields with `dimension` or `measure` type.
     * currently, this kind of type is not computed property unlike 'quantitative', 'nominal'...
     * This is defined by user's purpose or domain knowledge.
     */
    public mutFields: IRawField[] = [];
    
    // public fields: BIField[] = [];
    public cookedDataSource: IRow[] = [];
    public cookedDimensions: string[] = [];
    public cookedMeasures: string[] = [];
    public cleanMethod: CleanMethod = 'dropNull';
    /**
     * 作为计算属性来考虑
     */
    public fieldMetas: IFieldMeta[] = [];

    constructor() {
        makeAutoObservable(this, {
            rawData: observable.ref,
            cookedDataSource: observable.ref,
            cookedMeasures: observable.ref,
            fieldMetas: observable.ref
            // subscriptions: false
        });
    }

    public get fields () {
        return this.mutFields.filter(f => !f.disable);
    }

    public get dimensions () {
        return this.fields.filter((field) => field.analyticType === "dimension").map((field) => field.fid);
    }

    public get measures () {
        return this.fields.filter(field => field.analyticType === 'measure').map(field => field.fid)
    }

    public get dataSource (): IRow[] {
        return this.rawData.map((row) => {
            let record: IRow = {};
            this.fields.forEach((field) => {
                // if (field.type === 'dimension') {
                //     record[field.name] = `${row[field.name]}`
                // } else {
                //     record[field.name] = Transform.transNumber(row[field.name]);
                // }
                record[field.fid] = field.analyticType === "dimension" ? row[field.fid] : Transform.transNumber(row[field.fid]);
            });
            return record;
        });
    }

    public get cleanedData () {
        const { dataSource, dimensions, measures, cleanMethod} = this;
        return cleanData(deepcopy(dataSource), dimensions, measures, cleanMethod)
    }

    public setCleanMethod (method: CleanMethod) {
        this.cleanMethod = method;
    }

    public updateFieldAnalyticType (type: BIFieldType, fid: string) {
        const target = this.mutFields.find(f => f.fid === fid);
        if (target) {
            target.analyticType = type;
        }
    }

    public updateFieldSemanticType (type: ISemanticType, fid: string) {
        const target = this.mutFields.find(f => f.fid === fid);
        if (target) {
            target.semanticType = type;
        }
    }
    // public updateFieldInfo <K extends keyof IRawField> (fieldId: string, fieldPropKey: K, value: IRawField[K]) {
    public updateFieldInfo (fieldId: string, fieldPropKey: string, value: any) {
        // type a = keyof IRawField
        const target = this.mutFields.find(f => f.fid === fieldId);
        if (target) {
            // @ts-ignore
            target[fieldPropKey] = value;
            // target.type = type;
        }
    }

    public loadData (fields: IRawField[], rawData: IRow[]) {
        this.mutFields = fields.map(f => ({
            ...f,
            disable: false
        }))
        this.rawData = rawData
    }

    public async getFieldsMetas () {
        const ableFiledIds = this.fields.map(f => f.fid);
        const summary = await getFieldsSummaryService(this.cleanedData, ableFiledIds);
        const analyticTypes = this.fields.map(f => f.analyticType);
        const metas = fieldSummary2fieldMeta(summary, analyticTypes);
        runInAction(() => {
            this.fieldMetas = metas;
        })
    }
}
