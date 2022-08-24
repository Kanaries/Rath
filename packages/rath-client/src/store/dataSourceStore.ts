import { makeAutoObservable, observable, runInAction, toJS } from "mobx";
import { fromStream, IStreamListener, toStream } from "mobx-utils";
import { combineLatest, from, Subscription } from "rxjs";
import * as op from 'rxjs/operators'
import { IAnalyticType, ISemanticType } from "visual-insights";
import { notify } from "../components/error";
import { RATH_INDEX_COLUMN_KEY } from "../constants";
import { IDataPreviewMode, IDatasetBase, IFieldMeta, IMuteFieldBase, IRawField, IRow, IFilter, CleanMethod, IDataPrepProgressTag } from "../interfaces";
import { getQuantiles } from "../pages/dataSource/utils";
import { cleanDataService, extendDataService, filterDataService, getFieldsSummaryService, inferMetaService } from "../service";
import { expandDateTimeService } from "../dev/services";
// import { expandDateTimeService } from "../service";
import { findRathSafeColumnIndex } from "../utils";
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
    public filters: IFilter[] = [];
    
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
    public dataPreviewMode: IDataPreviewMode = IDataPreviewMode.data;
    public showDataImportSelection: boolean = false;
    public showFastSelectionModal: boolean = false;
    private fieldMetasRef: IStreamListener<IFieldMeta[]>;
    private cleanedDataRef: IStreamListener<IRow[]>;
    private filteredDataRef: IStreamListener<IRow[]>;
    public loadingDataProgress: number = 0;
    public dataPrepProgressTag: IDataPrepProgressTag = IDataPrepProgressTag.none;
    private subscriptions: Subscription[] = [];
    constructor() {
        makeAutoObservable(this, {
            rawData: observable.ref,
            cookedDataSource: observable.ref,
            cookedMeasures: observable.ref
            // subscriptions: false
        });
        const fields$ = from(toStream(() => this.fields, false));
        const fieldsNames$ = from(toStream(() => this.fieldNames, true));
        const rawData$ = from(toStream(() => this.rawData, false));
        const filters$ = from(toStream(() => this.filters, true))
        // const filteredData$ = from(toStream(() => this.filteredData, true));
        const filteredData$ = combineLatest([rawData$, filters$]).pipe(
            op.map(([dataSource, filters]) => {
                return from(filterDataService({
                    dataSource,
                    filters: toJS(filters)
                }))
            }),
            op.switchAll(),
            op.share()
        )
        const cleanMethod$ = from(toStream(() => this.cleanMethod, true));
        const cleanedData$ = combineLatest([filteredData$, cleanMethod$, fields$]).pipe(
            op.map(([data, method, fields]) => {
                return from(cleanDataService({
                    dataSource: data,
                    fields: fields.map(f => toJS(f)),
                    method: method
                }))
            }),
            op.switchAll(),
            op.share()
        )

        const originFieldMetas$ = cleanedData$.pipe(
            op.withLatestFrom(fields$),
            op.map(([dataSource, fields]) => {
                const ableFiledIds = fields.map(f => f.fid);
                return from(getFieldsSummaryService(dataSource, ableFiledIds)).pipe(
                    op.map(summary => {
                        const analyticTypes = fields.map(f => f.analyticType);
                        const geoRoles = fields.map(f => f.geoRole);
                        const metas = fieldSummary2fieldMeta({
                            summary,
                            analyticTypes,
                            geoRoles,
                            semanticTypes: fields.map(f => f.semanticType)
                        });
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
        this.filteredDataRef = fromStream(filteredData$, [])
        this.fieldMetasRef = fromStream(fieldMetas$, [])
        this.cleanedDataRef = fromStream(cleanedData$, []);
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
        this.subscriptions.push(rawData$.subscribe(() => {
            runInAction(() => {
                this.dataPrepProgressTag = IDataPrepProgressTag.filter;
            })
        }))
        this.subscriptions.push(filteredData$.subscribe(() => {
            runInAction(() => {
                this.dataPrepProgressTag = IDataPrepProgressTag.clean
            })
        }))
        this.subscriptions.push(cleanedData$.subscribe(() => {
            runInAction(() => {
                this.dataPrepProgressTag = IDataPrepProgressTag.none;
            })
        }))
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

    public get dimFields () {
        return this.fields.filter((field) => field.analyticType === "dimension")
    }

    public get measures () {
        return this.fields.filter(field => field.analyticType === 'measure').map(field => field.fid)
    }

    public get meaFields () {
        return this.fields.filter(field => field.analyticType === 'measure')
    }
    public get fieldNames (): string[] {
        return this.fields.map(f => `${f.name}`)
    }
    public get fieldSemanticTypes () {
        return this.fields.map(f => f.semanticType);
    }

    public get hasOriginalDimensionInData () {
        if (this.dimensions.length === 0) return false;
        if (this.dimensions.length === 1) {
            return !Boolean(this.dimensions.find(f => f === RATH_INDEX_COLUMN_KEY))
        }
        return true;
    }

    public get staisfyAnalysisCondition (): boolean {
        if (this.cleanedData.length === 0 || this.measures.length === 0 || this.dimensions.length === 0) {
            return false;
        }
        if (!this.hasOriginalDimensionInData) {
            return false;
        }
        return true;
    }

    // public get groupCounts () {
    //     return this.fieldMetas.filter(f => f.analyticType === 'dimension')
    //         .map(f => f.features.unique)
    //         .reduce((t, v) => t * v, 1)
    // }
    // /**
    //  * 防止groupCounts累乘的时候很快就超过int最大范围的情况
    //  */
    // public get groupCountsLog () {
    //     return this.fieldMetas.filter(f => f.analyticType === 'dimension')
    //         .map(f => f.features.maxEntropy)
    //         .reduce((t, v) => t + v, 0)
    // }
    public get groupMeanLimitCountsLog () {
        const valueCountsList = this.fieldMetas.filter(f => f.analyticType === 'dimension')
            .map(f => f.features.unique);
        const m = valueCountsList.reduce((t, v) => t + v, 0) / valueCountsList.length;
        // 3: 有意义的下钻层数
        // -1: 放款一个标准，到底层的时候允许是小样本
        const size = Math.min(3 - 1, valueCountsList.length)
        return size * Math.log2(m)
    }

    public get filteredData () {
        return this.filteredDataRef.current
        // const { rawData, filters } = this;
        // const ans: IRow[] = [];
        // if (filters.length === 0) return rawData;
        // const effectFilters = filters.filter(f => !f.disable);
        // for (let i = 0; i < rawData.length; i++) {
        //     const row = rawData[i];
        //     let keep = effectFilters.every(f => {
        //         if (f.type === 'range') return f.range[0] <= row[f.fid] && row[f.fid] <= f.range[1];
        //         if (f.type === 'set') return f.values.includes(row[f.fid]);
        //         return false;
        //     })
        //     if (keep) ans.push(row);
        // }
        // return ans
    }

    public get cleanedData () {
        return this.cleanedDataRef.current
    }

    public addFilter () {
        const sampleField = this.fieldMetas.find(f => f.semanticType === 'quantitative');
        this.filters = []
        if (sampleField) {
            this.filters.push({
                fid: sampleField.fid,
                disable: false,
                type: 'range',
                range: [0, Math.random() * 10]
            })
        }
    }

    public setFilter (filter: IFilter) {
        const filterIndex = this.filters.findIndex(f => f.fid === filter.fid);
        if (filterIndex > -1) {
            this.filters.splice(filterIndex, 1, { ...filter });
        } else {
            this.filters.push({
                ...filter
            })
        }
        this.filters = [...this.filters]
    }
    public createBatchFilterByQts (fieldIdList: string[], qts: [number, number][]) {
        const { rawData } = this;

        for (let i = 0; i < fieldIdList.length; i++) {
            // let domain = getRange();
            let range = getQuantiles(rawData.map(r => Number(r[fieldIdList[i]])), qts[i]) as [number, number]; 
            // if (this.filters.find())
            const filterIndex = this.filters.findIndex(f => f.fid === fieldIdList[i])
            const newFilter: IFilter = {
                fid: fieldIdList[i],
                type: 'range',
                range
            }
            if (filterIndex > -1) {
                this.filters.splice(filterIndex, 1, newFilter)
            } else {
                this.filters.push(newFilter)
            }
        }
        this.filters = [...this.filters]
    }

    public setLoadingDataProgress (p: number) {
        this.loadingDataProgress = p;
        if (this.dataPrepProgressTag === IDataPrepProgressTag.none && p < 1) this.dataPrepProgressTag = IDataPrepProgressTag.upload;
    }

    public setShowFastSelection (show: boolean) {
        this.showFastSelectionModal = show;
    }

    public setLoading (loading: boolean) {
        this.loading = loading;
    }

    public setDataPreviewMode(mode: IDataPreviewMode) {
        this.dataPreviewMode = mode;
    }

    public setShowDataImportSelection (show: boolean) {
        this.showDataImportSelection = show;
    }

    public setCleanMethod (method: CleanMethod) {
        this.cleanMethod = method;
    }

    public updateFieldAnalyticType (type: IAnalyticType, fid: string) {
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

    public exportDataAsDSService(): IDatasetBase {
        const { cleanedData, fieldMetas } = this;
        return {
            dataSource: cleanedData,
            fields: fieldMetas.map(f => ({
                ...f
            }))
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

    public async extendData () {
        // TODO: IRawField增加了extInfo?: IFieldExtInfoBase属性，此处应在新增字段的时候补充详细信息
        try {
            const { fields, cleanedData } = this;
            const res = await extendDataService({
                dataSource: cleanedData,
                fields
            })
            const finalFields = await inferMetaService({
                dataSource: res.dataSource,
                fields: res.fields.filter(f => Boolean(f.pfid)).map(f => ({
                    ...f,
                    semanticType: '?'
                }))
            })
            runInAction(() => {
                this.rawData = res.dataSource;
                this.mutFields = fields.concat(finalFields)
            })
        } catch (error) {
            notify({
                title: 'Extension API Error',
                type: 'error',
                content: `[extension]${error}`
            })
        }
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

    /**
     * Expand all temporal fields to (year, month, date, weekday, hour, minute, second, millisecond).
     * @depends this.fields, this.cleanedDate
     * @effects this.rawData, this.mutFields
     */
    public async expandDateTime() {
        try {
            let { mutFields, cleanedData } = this;
            mutFields = mutFields.map(f => toJS(f))
            const res = await expandDateTimeService({
                dataSource: cleanedData,
                fields: mutFields
            })
            runInAction(() => {
                this.rawData = res.dataSource;
                this.mutFields = res.fields
            })
        } catch (error) {
            notify({
                title: 'Expand DateTime API Error',
                type: 'error',
                content: `[extension]${error}`
            })
        }
    }
}
