import { nanoid } from "nanoid";
import { IReactionDisposer, makeAutoObservable, observable, reaction, runInAction, toJS } from "mobx";
import { combineLatest, from, Observable, Subscription } from "rxjs";
import { getFreqRange } from "@kanaries/loa";
import * as op from 'rxjs/operators'
import { notify } from "../components/error";
import { RATH_INDEX_COLUMN_KEY, PIVOT_KEYS } from "../constants";
import {
    IDataPreviewMode,
    IDatasetBase,
    IFieldMeta,
    IMuteFieldBase,
    IRawField,
    IRow,
    ICol,
    IFilter,
    CleanMethod,
    IDataPrepProgressTag,
    FieldExtSuggestion,
    IFieldMetaWithExtSuggestions,
    IExtField,
    IteratorStorageMetaInfo,
    IBackUpDataMeta,
    IBackUpData,
    DataSourceType,
} from "../interfaces";
import { cleanDataService, filterDataService,  inferMetaService, computeFieldMetaService } from "../services/index";
import { expandDateTimeService } from "../dev/services";
// import { expandDateTimeService } from "../service";
import { findRathSafeColumnIndex, colFromIRow, readableWeekday } from "../utils";
import { fromStream, StreamListener, toStream } from "../utils/mobx-utils";
import { getQuantiles } from "../lib/stat";
import { IteratorStorage } from "../utils/iteStorage";
import { DataSourceTag, updateDataStorageMeta } from "../utils/storage";
import { termFrequency, termFrequency_inverseDocumentFrequency } from "../lib/nlp/tf-idf";
import { IsolationForest } from "../lib/outlier/iforest";
import { compressRows, uncompressRows } from "../utils/rows2csv";
import { extractSelection, ITextPattern } from "../lib/textPattern";
import { getGlobalStore } from ".";

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

function fieldNotExtended (fid: string, mutFields: IMuteFieldBase[], extOpt: string) {
    const which = mutFields.find(f => f.fid === fid);
    const expanded = Boolean(mutFields.find(
        which => which.extInfo?.extFrom.includes(fid) && which.extInfo.extOpt === extOpt
    ));
    if (expanded) return;
    return which
}

export class DataSourceStore {
    public rawDataMetaInfo: IteratorStorageMetaInfo = {
        versionCode: -1,
        length: 0,
    };
    /**
     * raw data is fetched and parsed data or uploaded data without any other changes.
     * computed value `dataSource` will be calculated
     */
    public rawDataStorage!: IteratorStorage;
    public filteredDataStorage!: IteratorStorage;
    public extData = new Map<string, ICol<any>>();
    /**
     * fields contains fields with `dimension` or `measure` type.
     * currently, this kind of type is not computed property unlike 'quantitative', 'nominal'...
     * This is defined by user's purpose or domain knowledge.
     */
    public mutFields: IRawField[] = [];
    public extFields: IExtField[] = [];
    public fieldsWithExtSug: IFieldMetaWithExtSuggestions[] = [];
    public filters: IFilter[] = [];
    public cookedDataSource: IRow[] = [];
    public cookedDimensions: string[] = [];
    public cookedMeasures: string[] = [];
    public cleanMethod: CleanMethod = 'dropNull';
    public loading: boolean = false;
    public dataPreviewMode: IDataPreviewMode = IDataPreviewMode.data;
    public showDataImportSelection: boolean = false;
    public showFastSelectionModal: boolean = false;
    private fieldMetasRef!: StreamListener<IFieldMeta[]>;
    private cleanedDataRef!: StreamListener<IRow[]>;
    private filteredDataMetaInfoRef!: StreamListener<IteratorStorageMetaInfo>;
    public loadingDataProgress: number = 0;
    public dataPrepProgressTag: IDataPrepProgressTag = IDataPrepProgressTag.none;
    private subscriptions: Subscription[] = [];
    private reactions: IReactionDisposer[] = []
    public datasetId: string | null = null;
    public sourceType = DataSourceType.Unknown;
    constructor() {
        makeAutoObservable(this, {
            cookedDataSource: observable.ref,
            cookedMeasures: observable.ref,
            fieldsWithExtSug: observable.ref,
            extFields: observable.shallow,
            // @ts-expect-error private field
            subscriptions: false,
            cleanedDataRef: false,
            // filteredDataRef: false,
            fieldMetasRef: false,
            rawDataStorage: false,
            filteredDataStorage: false,
        });
        this.initStore();
    }
    public clear() {
        this.subscriptions.forEach(s => s.unsubscribe());
        this.subscriptions = [];
        this.reactions.forEach(dispose => dispose());
        this.reactions = [];
    }
    public initStore () {
        this.datasetId = null;
        this.rawDataMetaInfo = {
            versionCode: -1,
            length: 0,
        }
        this.extData = new Map<string, ICol<any>>();
        this.mutFields = [];
        this.extFields = [];
        this.fieldsWithExtSug = [];
        this.filters = [];
        this.cookedDataSource = [];
        this.cookedDimensions = [];
        this.cookedMeasures = [];
        this.cleanMethod = 'dropNull';
        this.loading = false;
        this.dataPreviewMode = IDataPreviewMode.data;
        this.showDataImportSelection = false;
        this.showFastSelectionModal = false;
        this.loadingDataProgress = 0;
        this.dataPrepProgressTag = IDataPrepProgressTag.none;
        this.datasetId = null;
        this.rawDataStorage = new IteratorStorage({ itemKey: 'rawData' });
        this.filteredDataStorage = new IteratorStorage({ itemKey: 'filteredData' });
        const fields$ = from(toStream(() => this.fieldsAndPreview, false));
        const fieldsNames$ = from(toStream(() => this.fieldNames, true));
        const fieldsComments$ = from(toStream(() => this.fieldComments, true));
        const rawDataMetaInfo$ = from(toStream(() => this.rawDataMetaInfo, false));
        const extData$ = from(toStream(() => this.extData, true));
        const filters$ = from(toStream(() => this.filters, true))
        const filteredDataMetaInfo$: Observable<IteratorStorageMetaInfo> = combineLatest([rawDataMetaInfo$, extData$, filters$]).pipe(
            op.map(([info, extData, filters]) => {
                return from(filterDataService({
                    computationMode: 'offline',
                    dataStorage: this.rawDataStorage,
                    resultStorage: this.filteredDataStorage,
                    extData: toJS(extData),
                    fields: toJS(this.mutFields),
                    filters: toJS(filters)
                }).then(r => {
                    return this.filteredDataStorage.syncMetaInfoFromStorage();
                }))
            }),
            op.switchAll(),
            op.share()
        )
        const cleanMethod$ = from(toStream(() => this.cleanMethod, true));
        const cleanedData$ = combineLatest([filteredDataMetaInfo$, cleanMethod$, fields$]).pipe(
            op.map(([info, method, fields]) => {
                return from(cleanDataService({
                    computationMode: 'offline',
                    storage: this.filteredDataStorage,
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
                return from(computeFieldMetaService({ dataSource, fields: fields.map(f => toJS(f)) }))
            }),
            op.switchAll(),
            op.share()
        )
        // 弱约束关系：fieldNames必须保证和metas是对应的顺序，这一对应可能会被fieldSummary的服务破坏。
        const fieldMetas$ = combineLatest([originFieldMetas$, fieldsNames$, fieldsComments$]).pipe(
            op.map(([originFieldMetas, fieldNames, fieldComments]) => {
                return originFieldMetas.map((m, index) => {
                    const ext = this.extFields.find(f => f.fid === m.fid);

                    return {
                        ...m,
                        extInfo: ext?.extInfo,
                        stage: ext?.stage,
                        name: ext?.name ?? fieldNames[index],
                        comment: ext?.comment ?? fieldComments[index],
                    }
                })
            }),
            op.share()
        )
        this.filteredDataMetaInfoRef = fromStream(filteredDataMetaInfo$, {
            versionCode: -1,
            length: 0
        })
        this.fieldMetasRef = fromStream(fieldMetas$, [])
        this.cleanedDataRef = fromStream(cleanedData$, []);
        window.addEventListener('message', (ev) => {
            const msg = ev.data as IDataMessage;
            const { type } = msg;
            const { commonStore } = getGlobalStore();
            switch (type) {
                case 'init_data': {
                    if (ev.source) {
                        console.warn('[Get DataSource From Other Pages]', msg)
                        // @ts-ignore
                        ev.source.postMessage(true, ev.origin)
                        this.loadDataWithInferMetas(msg.data.dataSource, msg.data.fields)
                        this.setShowDataImportSelection(false);
                        if (commonStore.appKey === PIVOT_KEYS.connection) {
                            commonStore.setAppKey(PIVOT_KEYS.dataSource);
                        }
                    }
                    break;
                }
                default: {
                    break;
                }
            }
        })
        this.subscriptions.push(rawDataMetaInfo$.subscribe(() => {
            runInAction(() => {
                this.dataPrepProgressTag = IDataPrepProgressTag.filter;
            })
        }))
        this.subscriptions.push(filteredDataMetaInfo$.subscribe(() => {
            runInAction(() => {
                this.dataPrepProgressTag = IDataPrepProgressTag.clean
            })
        }))
        this.subscriptions.push(cleanedData$.subscribe(() => {
            runInAction(() => {
                this.dataPrepProgressTag = IDataPrepProgressTag.none;
            })
        }))
        const suggestExt = (allFields: IRawField[] | undefined, fieldMetaAndPreviews: IFieldMeta[] | undefined) => {
            this.getExtSuggestions().then(res => {
                if (allFields && allFields !== this.allFields) {
                    return;
                } else if (fieldMetaAndPreviews && fieldMetaAndPreviews !== this.fieldMetaAndPreviews) {
                    return;
                }

                runInAction(() => {
                    this.fieldsWithExtSug = res;
                });
            });
        };
        this.reactions.push(reaction(() => this.allFields, allFields => {
            suggestExt(allFields, undefined);
        }))
        this.reactions.push(reaction(() => this.fieldMetaAndPreviews, fieldMetaAndPreviews => {
            suggestExt(undefined, fieldMetaAndPreviews);
        }))
    }
    public get filteredDataMetaInfo (): IteratorStorageMetaInfo {
        return this.filteredDataMetaInfoRef.current;
    }
    public get allFields() {
        return this.mutFields.concat(this.extFields)
    }
    public get fields () {
        // return this.mutFields.filter(f => !f.disable);
        return this.mutFields.filter(
            f => !f.disable
        ).concat(
            this.extFields.filter(f => !f.disable && f.stage === 'settled')
        );
    }
    public get fieldsAndPreview () {
        return this.mutFields.filter(
            f => !f.disable
        ).concat(
            this.extFields.filter(f => !f.disable)
        );
    }
    public get fieldMetas () {
        return this.fieldMetasRef.current.filter(m => m.stage !== 'preview');
    }
    public get fieldMetaAndPreviews () {
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
    public get fieldComments (): string[] {
        return this.fields.map(f => f.comment ?? '');
    }
    public get fieldSemanticTypes () {
        return this.fields.map(f => f.semanticType);
    }

    public get hasOriginalDimensionInData () {
        if (this.dimensions.length === 0) return false;
        if (this.dimensions.length === 1) {
            return !this.dimensions.find(f => f === RATH_INDEX_COLUMN_KEY)
        }
        return true;
    }

    public get satisfyAnalysisCondition (): boolean {
        if (this.cleanedData.length === 0 || this.measures.length === 0) {
            return false;
        }
        return true;
    }
    public get groupMeanLimitCountsLog () {
        const valueCountsList = this.fieldMetas.filter(f => f.analyticType === 'dimension')
            .map(f => f.features.unique);
        const m = valueCountsList.reduce((t, v) => t + v, 0) / valueCountsList.length;
        // 3: 有意义的下钻层数
        // -1: 放款一个标准，到底层的时候允许是小样本
        const size = Math.min(3 - 1, valueCountsList.length)
        return size * Math.log2(m)
    }

    public get cleanedData () {
        return this.cleanedDataRef.current
    }
    public setDatasetId (id: string) {
        this.datasetId = id;
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
    public removeFilter (fid: string) {
        const filterIndex = this.filters.findIndex(f => f.fid === fid);
        if (filterIndex > -1) {
            this.filters.splice(filterIndex, 1);
        }
        this.filters = [...this.filters]
    }
    public async createBatchFilterByQts (fieldIdList: string[], qts: [number, number][]) {
        const { rawDataStorage } = this;
        const data = await rawDataStorage.getAll();
        runInAction(() => {
            for (let i = 0; i < fieldIdList.length; i++) {
                // let domain = getRange();
                let range = getQuantiles(data.map(r => Number(r[fieldIdList[i]])), qts[i]) as [number, number]; 
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
        })
    }

    public setLoadingDataProgress (p: number) {
        this.loadingDataProgress = p;
        if (this.dataPrepProgressTag === IDataPrepProgressTag.none && p < 1) this.dataPrepProgressTag = IDataPrepProgressTag.upload;
    }

    public setShowFastSelection (show: boolean) {
        this.showFastSelectionModal = show;
    }
    public setAllMutFieldsDisable (disable: boolean) {
        for (let i = 0; i < this.mutFields.length; i++) {
            this.mutFields[i].disable = disable;
        }
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

    public updateDataMetaInIndexedDB () {
        if (this.datasetId) {
            updateDataStorageMeta(this.datasetId, toJS(this.mutFields));
        }
    }

    // public updateFieldInfo <K extends keyof IRawField> (fieldId: string, fieldPropKey: K, value: IRawField[K]) {
    public updateFieldInfo (fieldId: string, fieldPropKey: string, value: any) {
        // type a = keyof IRawField
        const target = this.mutFields.find(f => f.fid === fieldId) ?? this.extFields.find(f => f.fid === fieldId);
        if (target) {
            // @ts-ignore
            target[fieldPropKey] = value;
            // target.type = type;
            // 触发fieldsMeta监控可以被执行
            this.mutFields = [...this.mutFields];
            this.extFields = [...this.extFields];
            this.updateDataMetaInIndexedDB();
        }
    }

    /**
     * @deprecated
     * @returns 
     */
    public exportStore(): IDataSourceStoreStorage {
        const { mutFields, cookedDataSource, cookedDimensions, cookedMeasures, cleanMethod, fieldMetas } = this;
        // FIXME: rawData
        return {
            rawData: [],
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
            fields: fieldMetas.map(f => {
                const { features, distribution, ...others } = f
                return others
            })
        }
    }

    public exportCleanData () {
        const { cleanedData } = this;
        return cleanedData;
    }
    /**
     * @deprecated
     * @param state 
     */
    public importStore(state: IDataSourceStoreStorage) {
        // this.rawData = state.rawData;
        this.mutFields = state.mutFields;
        this.cookedDataSource = state.cookedDataSource;
        this.cookedDimensions = state.cookedDimensions;
        this.cookedMeasures = state.cookedMeasures;
        this.cleanMethod = state.cleanMethod;
        // FIXMe
        this.fieldMetasRef.current = state.fieldMetas
    } 

    public async loadDataWithInferMetas (dataSource: IRow[], fields: IMuteFieldBase[], tag?: DataSourceTag | undefined) {
        if (fields.length > 0 && dataSource.length > 0) {
            const metas = await inferMetaService({ dataSource, fields })
            this.initStore()
            // vega-lite's title contains \n will fail to render
            // fix: https://github.com/Kanaries/Rath/issues/381
            metas.forEach(m => {
                if (m.name) {
                    m.name = m.name.replace(/[\n\t\r]+/g, '')
                }
            })
            await this.rawDataStorage.setAll(dataSource)
            runInAction(() => {
                this.sourceType = tag ? {
                    [DataSourceTag.AIR_TABLE]: DataSourceType.AirTable,
                    [DataSourceTag.DATABASE]: DataSourceType.Database,
                    [DataSourceTag.DEMO]: DataSourceType.Unknown,
                    [DataSourceTag.FILE]: DataSourceType.File,
                    [DataSourceTag.OLAP]: DataSourceType.Olap,
                    [DataSourceTag.RESTFUL]: DataSourceType.Unknown,
                }[tag] : DataSourceType.Unknown;
                this.loading = false;
                this.rawDataMetaInfo = this.rawDataStorage.metaInfo;
                this.showDataImportSelection = false;
                // 如果除了安全维度，数据集本身就有维度
                if (metas.filter(f => f.analyticType === 'dimension').length > 1) {
                    const rathColIndex = findRathSafeColumnIndex(metas);
                    if (rathColIndex > -1) {
                        metas[rathColIndex].disable = true
                    }
                }
                this.mutFields = metas;
                this.updateDataMetaInIndexedDB()
            })
        }
    }

    /**
     * Expand all temporal fields to (year, month, date, weekday, hour, minute, second, millisecond).
     * @depends this.fields, this.cleanedDate
     * @effects this.rawData, this.mutFields
     * @deprecated for a single field, use `dataSourceStore.expandSingleDateTime()` instead.
     */
    public async expandDateTime() {
        try {
            let { mutFields } = this;
            mutFields = mutFields.map(f => toJS(f))
            const data = await this.rawDataStorage.getAll();
            const res = await expandDateTimeService({
                dataSource: data,
                fields: mutFields
            })
            await this.rawDataStorage.setAll(res.dataSource)
            runInAction(() => {
                this.rawDataMetaInfo = this.rawDataStorage.metaInfo;
                this.mutFields = res.fields
            })
        } catch (error) {
            console.error(error)
            notify({
                title: 'Expand DateTime API Error',
                type: 'error',
                content: `[extension]${error}`
            })
        }
    }

    protected async getExtSuggestions(): Promise<IFieldMetaWithExtSuggestions[]> {
        const fieldWithExtSuggestions: IFieldMetaWithExtSuggestions[] = [];
        const { allFields } = this;
        for (let mf of allFields) {
            const meta = this.fieldMetaAndPreviews.find(m => m.fid === mf.fid);
            const dist = meta ? meta.distribution : [];

            const f: IFieldMeta = {
                ...mf,
                disable: mf.disable,
                distribution: dist,
                features: meta ? meta.features: { entropy: 0, maxEntropy: 0, unique: dist.length },
            };

            if (f.extInfo) {
                // 属于扩展得到的字段，不进行推荐
                fieldWithExtSuggestions.push({
                    ...f,
                    extSuggestions: [],
                })
                continue;
            }

            const suggestions: FieldExtSuggestion[] = [];

            if (f.semanticType === 'temporal') {
                const alreadyExpandedAsDateTime = Boolean(this.allFields.find(
                    which => which.extInfo?.extFrom.includes(f.fid) && which.extInfo.extOpt === 'dateTimeExpand'
                ));

                if (!alreadyExpandedAsDateTime) {
                    suggestions.push({
                        score: 10,
                        type: 'dateTimeExpand',
                        apply: () => this.expandSingleDateTime(f.fid),
                    });
                }
            }
            if (f.semanticType === 'quantitative') {
                const alreadyExpandedAsOutlier = Boolean(this.allFields.find(
                    which => which.extInfo?.extFrom.includes(f.fid) && which.extInfo.extOpt === 'CC.outlier'
                ));
                if (!alreadyExpandedAsOutlier && this.canExpandAsOutlier(f.fid)) {
                    suggestions.push({
                        score: 6,
                        type: 'outlierIForest',
                        apply: () => this.expandOutlier(f.fid),
                    });
                }
                
            }
            if (f.semanticType === 'nominal') {
                const mayHaveSentences = await this.canExpandAsWord(f.fid);
                const alreadyExpandedAsOneHot = Boolean(this.allFields.find(
                    which => which.extInfo?.extFrom.includes(f.fid) && which.extInfo.extOpt === 'CC.oneHot'
                ));
                if (!alreadyExpandedAsOneHot) {
                    suggestions.push({
                        score: 3,
                        type: 'oneHot',
                        apply: () => this.expandNominalOneHot(f.fid),
                    })
                }
                const alreadyExpandedAsWordTF = Boolean(this.allFields.find(
                    which => which.extInfo?.extFrom.includes(f.fid) && which.extInfo.extOpt === 'CC.wordTF'
                ));
                if (!alreadyExpandedAsWordTF && mayHaveSentences) {
                    suggestions.push({
                        score: 9,
                        type: 'wordTF',
                        apply: () => this.expandWordTF(f.fid),
                    })
                }
                const alreadyExpandedAsWordTFIDF = Boolean(this.allFields.find(
                    which => which.extInfo?.extFrom.includes(f.fid) && which.extInfo.extOpt === 'CC.wordTFIDF'
                ));
                if (!alreadyExpandedAsWordTFIDF && mayHaveSentences) {
                    suggestions.push({
                        score: 6,
                        type: 'wordTFIDF',
                        apply: () => this.expandWordTFIDF(f.fid),
                    })
                }
                const alreadyExpandedAsReGroupByFreq = Boolean(this.allFields.find(
                    which => which.extInfo?.extFrom.includes(f.fid) && which.extInfo.extOpt === 'CC.reGroupByFreq'
                ));
                if (!alreadyExpandedAsReGroupByFreq && this.canExpandAsReGroupByFreq(f.fid)) {
                    suggestions.push({
                        score: 5,
                        type: 'reGroupByFreq',
                        apply: () => this.expandReGroupByFreq(f.fid),
                    })
                }
            }
            fieldWithExtSuggestions.push({
                ...f,
                extSuggestions: suggestions
            })
        }
        return fieldWithExtSuggestions;
    }

    public addExtSuggestions (suggestion: FieldExtSuggestion, fid: string) {
        const field = this.fieldMetas.find(f => f.fid === fid);
        if (!field) {
            return;
        }
        let which = this.fieldsWithExtSug.find(f => f.fid === fid);
        if (!which) {
            which = {
                ...field,
                extSuggestions: []
            }
            this.fieldsWithExtSug.push(which);
        }
        const targetIndex  = which.extSuggestions.findIndex(s => s.type === suggestion.type);
        if (targetIndex > -1) {
            which.extSuggestions.splice(targetIndex, 1);
        }
        which.extSuggestions.push(suggestion);
        which.extSuggestions.sort((a, b) => b.score - a.score)
    }

    public canExpandAsDateTime(fid: string) {
        const which = fieldNotExtended(fid, this.mutFields, 'dateTimeExpand');
        if (typeof which === 'undefined') return;

        return which.semanticType === 'temporal' && !which.extInfo;
    }
    public canExpandAsReGroupByFreq(fid: string) {
        const which = fieldNotExtended(fid, this.mutFields, 'CC.reGroupByFreq');
        if (typeof which === 'undefined') return;
        if (which.semanticType !== 'nominal') {
            return false;
        }
        const meta = this.fieldMetas.find(f => f.fid === fid);
        if (!meta) return false;
        return meta.features.unique > 8;
    }
    public canExpandAsOutlier(fid: string) {
        const which = fieldNotExtended(fid, this.mutFields, 'CC.outlierIForest');
        if (typeof which === 'undefined') return;
        if (!(which.semanticType === 'quantitative' && !which.extInfo)) return false;
        const meta = this.fieldMetas.find(f => f.fid === fid);
        if (!meta) return false;
        return Number(meta.features.max) - Number(meta.features.min) > (Number(meta.features.qt_75) - Number(meta.features.qt_25)) * 3.5;
    }

    public async canExpandAsWord (fid: string) {
        const which = this.mutFields.find(f => f.fid === fid);
        if (typeof which === 'undefined') return;

        if (!(which.semanticType === 'nominal' && !which.extInfo)) return false;
        const data = await this.rawDataStorage.getAll();
        if (data.length < 10) return false;
        let rowHasWords = 0;
        const reg = /.*[\s,.]+.*/
        for (let row of data) {
            if (typeof row[fid] === 'string') {
                if (reg.test(row[fid])) {
                    rowHasWords++;
                }
            }
        }
        return rowHasWords / data.length > 0.5;
    }
    
    public async expandSingleDateTime(fid: string) {
        if (!this.canExpandAsDateTime(fid)) {
            return;
        }

        try {
            let { allFields } = this;
            allFields = allFields.filter(f => f.fid === fid).map(f => toJS(f))
            const data = await this.rawDataStorage.getAll();
            const res = await expandDateTimeService({
                dataSource: data,
                fields: allFields
            })
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const [_origin, ...enteringFields] = res.fields;

            this.addExtFieldsFromRows(
                res.dataSource,
                enteringFields.map(f => ({
                    ...f,
                    stage: 'preview',
                }))
            );
        } catch (error) {
            console.error(error)
            notify({
                title: 'Expand DateTime API Error',
                type: 'error',
                content: `[extension]${error}`
            })
        }
    }
    public async expandWordTFIDF (fid: string) {
        const data = await this.rawDataStorage.getAll();
        const values: string[] = data.map(d => `${d[fid]}`);
        const wordsInRow = values.map(v => v.split(/[\s,.]+/));
        const tfidf = termFrequency_inverseDocumentFrequency(wordsInRow).map((docInfo) => {
            return Array.from(docInfo.entries()).sort((a, b) => b[1] - a[1]).map(([word, score]) => {
                return {
                    word,
                    score,
                }
            })
        });
        const originField = this.allFields.find(f => f.fid === fid);
        if (originField) {
            const newField: IRawField = {
                fid: `${fid}_wordTFIDF`,
                name: `${originField.name}.word_tf_idf`,
                semanticType: 'nominal',
                analyticType: 'dimension',
                extInfo: {
                    extFrom: [fid],
                    extOpt: 'CC.wordTFIDF',
                    extInfo: {}
                },
                geoRole: 'none'
            }
            const newData = data.map((d, index) => {
                const tfidfInfo = tfidf[index];
                const word = tfidfInfo.slice(0, 1).map(r => r.word).join('_');
                return {
                    ...d,
                    [newField.fid]: word,
                }
            });
            this.addExtFieldsFromRows(newData, [newField].map(f => ({
                ...f,
                stage: 'preview',
            })));
        }
    }
    public clearTextPatternIfExist () {
        const extRemainFields = this.extFields.filter(f => !(f.extInfo?.extOpt === 'CC.selection_pattern' && f.stage === 'preview'));
        if (extRemainFields.length !== this.extFields.length) {
            this.extFields = extRemainFields;
        }
    }
    public async expandFromSelectionPattern (fid: string, pattern: ITextPattern) {
        const originField = this.allFields.find(f => f.fid === fid);
        if (!originField) {
            return;
        }
        this.clearTextPatternIfExist();
        const data = await this.rawDataStorage.getAll();
        const values: string[] = data.map(d => `${d[fid]}`);
        const newField: IRawField = {
            fid: `${fid}_selection_pattern_${nanoid(2)}`,
            name: `${originField.name}.selection_pattern`,
            semanticType: 'nominal',
            analyticType: 'dimension',
            extInfo: {
                extFrom: [fid],
                extOpt: 'CC.selection_pattern',
                extInfo: {
                    pattern: pattern.toString(),
                }
            },
            geoRole: 'none'
        }
        const newData = data.map((d, index) => {
            const extraction = extractSelection(pattern, values[index])
            const nextRow = { ...d };
            if (!extraction.missing) {
                nextRow[newField.fid] = extraction.matchedText
            }
            return nextRow
        });
        this.addExtFieldsFromRows(newData, [newField].map(f => ({
            ...f,
            stage: 'preview',
        })));
    }
    public async expandFromRegex (fid: string, pattern: RegExp) {
        const originField = this.allFields.find(f => f.fid === fid);
        if (!originField) {
            return;
        }
        this.clearTextPatternIfExist();
        const data = await this.rawDataStorage.getAll();
        const values: string[] = data.map(d => `${d[fid]}`);
        const newField: IRawField = {
            fid: `${fid}_regex`,
            name: `${originField.name}.regex`,
            semanticType: 'nominal',
            analyticType: 'dimension',
            extInfo: {
                extFrom: [fid],
                extOpt: 'CC.regex',
                extInfo: {
                    pattern: pattern.toString(),
                }
            },
            geoRole: 'none'
        }
        const newData = data.map((d, index) => {
            const match = values[index].match(pattern);
            if (match) {
                return {
                    ...d,
                    [newField.fid]: match[0],
                }
            }
            return d;
        });
        this.addExtFieldsFromRows(newData, [newField].map(f => ({
            ...f,
            stage: 'preview',
        })));
    }

    public async expandWordTF (fid: string) {
        const data = await this.rawDataStorage.getAll();
        const values: string[] = data.map(d => `${d[fid]}`);
        const wordsInRow = values.map(v => v.split(/[\s,.]+/));
        const tf = termFrequency(wordsInRow).map((docInfo) => {
            return Array.from(docInfo.entries()).sort((a, b) => b[1] - a[1]).map(([word, score]) => {
                return {
                    word,
                    score,
                }
            })
        });
        const originField = this.allFields.find(f => f.fid === fid);
        if (originField) {
            const newField: IRawField = {
                fid: `${fid}_wordTF`,
                name: `${originField.name}.word_tf`,
                semanticType: 'nominal',
                analyticType: 'dimension',
                extInfo: {
                    extFrom: [fid],
                    extOpt: 'CC.wordTF',
                    extInfo: {}
                },
                geoRole: 'none'
            }
            const newData = data.map((d, index) => {
                const tfInfo = tf[index];
                const word = tfInfo.slice(0, 1).map(r => r.word).join('_');
                return {
                    ...d,
                    [newField.fid]: word,
                }
            });
            this.addExtFieldsFromRows(newData, [newField].map(f => ({
                ...f,
                stage: 'preview',
            })));
        }
    }
    public async expandReGroupByFreq (fid: string) {
        const originField = this.allFields.find(f => f.fid === fid);
        if (!originField) {
            return;
        }
        const data = await this.rawDataStorage.getAll();
        const topUniqueValues = getFreqRange(data.map(r => r[fid]));
        const valuePool = new Set(topUniqueValues.map(r => r[0]).slice(0, topUniqueValues.length - 1))
        const newField: IRawField = {
            fid: `${fid}_reGroupByFreq`,
            name: `${originField.name || fid}.reGroupByFreq`,
            semanticType: 'nominal',
            analyticType: 'dimension',
            extInfo: {
                extFrom: [fid],
                extOpt: 'CC.reGroupByFreq',
                extInfo: {}
            },
            geoRole: 'none'
        }
        const newData = data.map((d) => {
            const value = d[fid];
            return {
                ...d,
                [newField.fid]: valuePool.has(value) ? value : 'others',
            }
        })
        this.addExtFieldsFromRows(newData, [newField].map(f => ({
            ...f,
            stage: 'preview',
        })));
    }
    public async expandNominalOneHot(fid: string) {
        const data = await this.rawDataStorage.getAll();
        const values = data.map(d => d[fid]);
        const limitSize = 8;
        const topKValues = getFreqRange(values).slice(0, limitSize);
        const valueSet = new Set(topKValues.map(f => f[0]));
        const originField = this.allFields.find(f => f.fid === fid);
        if (!originField)return;
        const newFields: IRawField[] = topKValues.map((v, i) => {
            return {
                fid: `${fid}_ex${i}`,
                name: `${originField.name || originField.fid}.${v[0].replace(/[\s,.]+/g, '_')}`,
                semanticType: 'nominal',
                analyticType: 'dimension',
                extInfo: {
                    extFrom: [fid],
                    extOpt: 'CC.oneHot',
                    extInfo: {}
                },
                geoRole: 'none'
            } as IRawField})
        const sizeWithOutOthers = Math.min(limitSize - 1, topKValues.length);
        if (sizeWithOutOthers < newFields.length) {
            newFields[newFields.length - 1].name = `${originField.name || originField.fid}.others`;
        }
        const newData = data.map(d => ({ ...d}));
        
        for (let i = 0; i < newData.length; i++) {
            for (let j = 0; j < sizeWithOutOthers; j++) {
                newData[i][newFields[j].fid] = newData[i][fid] === topKValues[j][0] ? 1 : 0;
            }
            if (sizeWithOutOthers < newFields.length) {
                newData[i][newFields[newFields.length - 1].fid] = valueSet.has(newData[i][fid]) ? 0 : 1;
            }
        }
        this.addExtFieldsFromRows(newData, newFields.map(f => ({
            ...f,
            stage: 'preview',
        })));
    }

    public async expandOutlier (fid: string) {
        const data = await this.rawDataStorage.getAll();
        const values = data.map(d => d[fid]);
        const originField = this.allFields.find(f => f.fid === fid);
        if (!originField)return;
        const newField: IRawField = {
            fid: `${fid}_outlier_iforest`,
            name: `${originField.name || originField.fid}.outlierIForest`,
            semanticType: 'nominal',
            analyticType: 'dimension',
            extInfo: {
                extFrom: [fid],
                extOpt: 'CC.outlierIForest',
                extInfo: {}
            },
            geoRole: 'none'
        }
        const newData = data.map(d => ({ ...d}));
        const iForest = new IsolationForest(256, 100, 'auto');
        const outliers = iForest.fitPredict(values.map(v => [v]));
        for (let i = 0; i < newData.length; i++) {
            newData[i][newField.fid] = outliers[i];
        }
        this.addExtFieldsFromRows(newData, [newField].map(f => ({
            ...f,
            stage: 'preview',
        })));
    }

    /**
     * Add extended data into `dataSourceStore.extFields` and `dataSourceStore.extData`.
     * @effects `this.extData`, `this.extFields`
     */
    public addExtFieldsFromRows(extData: readonly IRow[], extFields: IExtField[]) {
        let extDataCol = colFromIRow(extData, extFields);
        this.addExtFields(extDataCol, extFields);
    }
    /**
     * Add extended data into `dataSourceStore.extFields` and `dataSourceStore.extData`.
     * @effects `this.extData`, `this.extFields`
     */
    public addExtFields(extData: Map<string, ICol<any>>, extFields: IExtField[]) {
        try {
            runInAction(() => {
                this.extFields = this.extFields.concat(extFields);
                let data = new Map<string, ICol<any>>(this.extData.entries());
                for (let i = 0; i < extFields.length; ++i) {
                    const { fid, extInfo } = extFields[i];
                    const isWeekday = extInfo?.extOpt === 'dateTimeExpand' && extInfo.extInfo === '$W';
                    if (!extData.has(fid)) throw new Error("unknown fid: " + fid);

                    if (isWeekday) {
                        const col = extData.get(fid) as ICol<number>;

                        extFields[i].semanticType = 'ordinal';

                        data.set(fid, {
                            fid: col.fid,
                            data: col.data.map(d => readableWeekday(d)),
                        });
                    } else {
                        data.set(fid, extData.get(fid) as ICol<any>);
                    }
                }
                this.extData = data;
            })
        } catch (error) {
            console.error(error);
            notify({
                title: 'addExtFields Error',
                type: 'error',
                content: `[addExt]${error}`
            })
        }
    }

    public settleExtField(fid: string) {
        const fields = [...this.extFields];
        const f = fields.find(which => which.fid === fid);

        if (f) {
            runInAction(() => {
                f.stage = 'settled';
                this.extFields = fields;
            });
        }
    }

    public deleteExtField(fid: string) {
        const fields = [...this.extFields];
        const idx = fields.findIndex(which => which.fid === fid);

        if (idx !== -1) {
            fields.splice(idx, 1);
            
            runInAction(() => {
                this.extFields = fields;
            });
        }
    }

    public async backupMetaStore (): Promise<IBackUpDataMeta> {
        const { extFields, mutFields, rawDataMetaInfo, filters, cleanMethod } = this;
        const data: IBackUpDataMeta = {
            mutFields: toJS(mutFields),
            extFields: extFields,
            rawDataMetaInfo: rawDataMetaInfo,
            filters: toJS(filters),
            cleanMethod: cleanMethod
        };
        return data;
    }
    public async backupDataStore (): Promise<IBackUpData> {
        const { rawDataStorage, mutFields } = this;
        const data = await rawDataStorage.getAll();
        return {
            rawData: compressRows(data, mutFields),
            extData: Array.from(this.extData.entries()),
        }
    }
    public async loadBackupDataStore (data: IBackUpData, meta: IBackUpDataMeta) {
        const { rawData, extData } = data;
        const { rawDataStorage } = this;
        this.extData = new Map(extData);
        await rawDataStorage.setAll(uncompressRows(rawData, meta.mutFields.map(f => f.fid)));
        runInAction(() => {
            this.sourceType = DataSourceType.Unknown;
            this.datasetId = null;
            this.rawDataMetaInfo = rawDataStorage.metaInfo;
            this.mutFields = meta.mutFields;
            this.extFields = meta.extFields;
            this.rawDataMetaInfo = meta.rawDataMetaInfo;
            this.filters = meta.filters;
            this.cleanMethod = meta.cleanMethod as CleanMethod;
        });
        this.setShowDataImportSelection(false);
    }
    public async loadBackupMetaStore (data: IBackUpDataMeta) {
        const { mutFields, extFields, rawDataMetaInfo, filters, cleanMethod } = data;
        runInAction(() => {
            this.sourceType = DataSourceType.Unknown;
            this.datasetId = null;
            this.mutFields = mutFields;
            this.extFields = extFields;
            this.rawDataMetaInfo = rawDataMetaInfo;
            this.filters = filters;
            this.cleanMethod = cleanMethod as CleanMethod;
        });
    }

}
