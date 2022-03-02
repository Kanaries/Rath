import { makeAutoObservable, observable, runInAction } from "mobx";
import { fromStream, IStreamListener, toStream } from "mobx-utils";
import { combineLatest, from } from "rxjs";
import * as op from 'rxjs/operators'
import { ISemanticType } from "visual-insights/build/esm/insights/InsightFlow/interfaces";
import { NextVICore } from "../dev";
import { BIFieldType } from "../global";
import { IDatasetBase, IFieldMeta, IMuteFieldBase, IRawField, IRow } from "../interfaces";
import { cleanData, CleanMethod } from "../pages/dataSource/clean";
import { getFieldsSummaryService, inferMetaService } from "../service";
import { findRathSafeColumnIndex, Transform } from "../utils";
import { fieldSummary2fieldMeta } from "../utils/transform";

interface IDataMessage {
    type: 'init_data' | 'others';
    data: IDatasetBase
}

// 关于dataSource里的单变量分析和pipeline整合的考虑：
// ds目前这里设置的是用户可能进行一定的数据类型定义，转换操作。用户此时关心的是单变量的信息，并不需要自动的触发后续流的计算，
// 所以这里不会干预主pipeline，是一个断层的解构。在用户完成设置之后，才会把它作为参数同步给pipeline。
// 但这并不意味着其不可以用stream的方式写，我们只需要把它放在流的缓存中，主流程在其他stream里即可(withLatestFrom)
interface IDataSourceStoreStorage {
    rawData: IRow[];
    mutFields: IRawField[];
    cookedDataSource: IRow[];
    cookedDimensions: string[];
    cookedMeasures: string[];
    cleanMethod: CleanMethod;
    fieldMetas: IFieldMeta[];
}
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
    // public fieldMetas: IFieldMeta[] = [];
    public loading: boolean = false;
    public showDataImportSelection: boolean = false;
    private fieldMetasRef: IStreamListener<IFieldMeta[]>;
    constructor() {
        makeAutoObservable(this, {
            rawData: observable.ref,
            cookedDataSource: observable.ref,
            cookedMeasures: observable.ref
            // subscriptions: false
        });
        const fields$ = from(toStream(() => this.fields, true));
        const cleanedData$ = from(toStream(() => this.cleanedData, true))
        const fieldsNames$ = from(toStream(() => this.fieldNames, true));
        // const fieldSemanticTypes
        const originFieldMetas$ =  combineLatest([fields$, cleanedData$]).pipe(
            op.map(([fields, cleanedData]) => {
                const ableFiledIds = fields.map(f => f.fid);
                return from(getFieldsSummaryService(cleanedData, ableFiledIds)).pipe(
                    op.map(summary => {
                        const analyticTypes = fields.map(f => f.analyticType);
                        const metas = fieldSummary2fieldMeta({
                            summary,
                            analyticTypes,
                            semanticTypes: fields.map(f => f.semanticType)
                        });
                        // console.log('metas1', metas, fields)
                        // metas.forEach(m => {
                        //     const f = fields.find(f => f.fid === m.fid);
                        //     if (f) {
                        //         m.name = f.name
                        //     }
                        // })
                        // console.log('metas2', metas, fields)
                        return metas
                    })
                )
            }),
            op.switchAll(),
            op.share()
        )
        // 弱约束关系：fieldNames必须保证和metas是对应的顺序，这一对应可能会被fieldSummary的服务破坏。
        const fieldMetas$ = combineLatest([originFieldMetas$, fieldsNames$]).pipe(
            op.map(([originFieldMetas, fieldNames]) => {
                return originFieldMetas.map((m, index) => {
                    return {
                        ...m,
                        name: fieldNames[index]
                    }
                })
            }),
            op.share()
        )
        this.fieldMetasRef = fromStream(fieldMetas$, [])
        window.addEventListener('message', (ev) => {
            const msg = ev.data as IDataMessage;
            if (ev.source && msg.type === 'init_data') {
                console.log('[Get DataSource From Other Pages]', msg)
                // @ts-ignore
                ev.source.postMessage(true, ev.origin)
                this.loadDataWithInferMetas(msg.data.dataSource, msg.data.fields)
                this.setShowDataImportSelection(false);
            }
        })
    }

    public get fields () {
        return this.mutFields.filter(f => !f.disable);
    }
    public get fieldMetas () {
        return this.fieldMetasRef.current
    }

    public get dimensions () {
        return this.fields.filter((field) => field.analyticType === "dimension").map((field) => field.fid);
    }

    public get measures () {
        return this.fields.filter(field => field.analyticType === 'measure').map(field => field.fid)
    }
    public get fieldNames (): string[] {
        return this.fields.map(f => `${f.name}`)
    }

    public get cleanedData () {
        const { rawData, dimensions, measures, cleanMethod } = this;
        const dataSource = rawData.map((row) => {
            let record: IRow = {};
            this.fields.forEach((field) => {
                // if (field.type === 'dimension') {
                //     record[field.name] = `${row[field.name]}`
                // } else {
                //     record[field.name] = Transform.transNumber(row[field.name]);
                // }
                if (field.analyticType === 'dimension') {
                    if (field.semanticType === 'temporal' || field.semanticType === 'nominal') {
                        record[field.fid] = String(row[field.fid])
                    } else {
                        record[field.fid] = row[field.fid]
                    }
                } else {
                    record[field.fid] = Transform.transNumber(row[field.fid]);
                }
            });
            return record;
        });

        return cleanData(dataSource, dimensions, measures, cleanMethod)
    }

    public setLoading (loading: boolean) {
        this.loading = loading;
    }

    public setShowDataImportSelection (show: boolean) {
        this.showDataImportSelection = show;
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
            // 触发fieldsMeta监控可以被执行
            this.mutFields = [...this.mutFields];
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
            // 触发fieldsMeta监控可以被执行
            this.mutFields = [...this.mutFields];
        }
    }

    public loadData (fields: IRawField[], rawData: IRow[]) {
        this.mutFields = fields.map(f => ({
            ...f,
            name: f.name ? f.name : f.fid,
            disable: false
        }))
        this.rawData = rawData
        this.loading = false;
    }

    public setFieldName (fIndex: number, name: string) {
        this.mutFields[fIndex].name = name
    }

    public exportStore(): IDataSourceStoreStorage {
        const { rawData, mutFields, cookedDataSource, cookedDimensions, cookedMeasures, cleanMethod, fieldMetas } = this;
        return {
            rawData,
            mutFields,
            cookedDataSource,
            cookedDimensions,
            cookedMeasures,
            cleanMethod,
            fieldMetas
        }
    }

    public importStore(state: IDataSourceStoreStorage) {
        this.rawData = state.rawData;
        this.mutFields = state.mutFields;
        this.cookedDataSource = state.cookedDataSource;
        this.cookedDimensions = state.cookedDimensions;
        this.cookedMeasures = state.cookedMeasures;
        this.cleanMethod = state.cleanMethod;
        // FIXMe
        this.fieldMetasRef.current = state.fieldMetas
    }

    public async loadDataWithInferMetas (dataSource: IRow[], fields: IMuteFieldBase[]) {
        if (fields.length > 0 && dataSource.length > 0) {
            const metas = await inferMetaService({ dataSource, fields })
            runInAction(() => {
                this.rawData = dataSource;
                this.loading = false;
                this.showDataImportSelection = false;
                // 如果除了安全维度，数据集本身就有维度
                if (metas.filter(f => f.analyticType === 'dimension').length > 1) {
                    const rathColIndex = findRathSafeColumnIndex(metas);
                    if (rathColIndex > -1) {
                        metas[rathColIndex].disable = true
                    }
                }
                this.mutFields = metas;
            })
        }
    }
    public dev() {
        const core = new NextVICore(this.cleanedData, this.fieldMetas);
        // console.log(core.firstPattern())
        // console.log(core.secondPattern())
        console.log(core.featureSelectForSecondPattern())
    }
}
