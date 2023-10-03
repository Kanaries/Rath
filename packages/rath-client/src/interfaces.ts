// define new interfaces here, global.ts is no longer maintained.
import { AnyMark } from "vega-lite/build/src/mark";
import { IAnalyticType, IFieldSummary, IInsightSpace, ISemanticType } from "visual-insights";
import { IFilter, IPattern } from '@kanaries/loa'
import { Aggregator } from "./global";
import type { DateTimeInfoType } from "./dev/workers/engine/dateTimeExpand";

export interface IRow {
    [key: string]: any
}

export interface ICol<T> {
    fid: string;
    data: Array<T>;
}

export type IGeoRole = 'longitude' | 'latitude' | 'none';

export type FieldExtOptType = (
    | 'dateTimeExpand'
    | `CC.${string}`
);

/** Detailed information of a extended field.  */
interface IFieldExtInfoBase {
    /** Field id of fields that this field inferred from.  */
    extFrom: string[];
    /** The identifier of the data-extension operation. */
    extOpt: FieldExtOptType;
    /** Additional information of the specified extension operation */
    extInfo: any;
}

export interface IFieldExtInfoBaseDateTime extends IFieldExtInfoBase {
    extFrom: [string];  // from only one field
    extOpt: 'dateTimeExpand';
    extInfo: DateTimeInfoType;
}

interface IFieldExtInfoBaseCustomComputation extends IFieldExtInfoBase {
    extOpt: `CC.${string}`;
    extInfo: any;
}

type FieldExtInfoBase = (
    | IFieldExtInfoBaseDateTime
    | IFieldExtInfoBaseCustomComputation
);

export type FieldExtSuggestion = {
    /** score 越高，推荐顺序越靠前 */
    score: number;
    type: string;
    apply: (fieldId: string) => Promise<void>;
};

interface IFieldBase {
    fid: string;
    name?: string;
    comment?: string;
    analyticType: IAnalyticType;
    semanticType: ISemanticType;
    geoRole: IGeoRole;
    /** detailed information of field extension operations. defined only if this field is extended */
    extInfo?: FieldExtInfoBase;
    /** @default "settled" */
    stage?: 'preview' | 'settled';
}
export interface IRawField extends IFieldBase {
    disable?: boolean;
    pfid?: string | null;
}

export interface IExtField extends IRawField {
    stage: 'preview' | 'settled';
}

/**
 * ImuteFieldBase 是未来替换IRawField的新interface，其扩展了'?'类型，方便告诉后续的类型推断机制来做。
 */
export interface IMuteFieldBase {
    fid: string;
    name?: string;
    analyticType: 'dimension' | 'measure' | '?';
    semanticType: 'nominal' | 'temporal' | 'ordinal' | 'quantitative' | '?';
    disable?: boolean | '?';
    geoRole: IGeoRole | '?';
    /** detailed information of field extension operations. Non-null if this field is extended */
    extInfo?: IFieldExtInfoBase;
}

export interface IFieldMeta extends IFieldBase {
    /**
     * 性质上是计算属性，只读。
     */
    features: {
        entropy: number;
        maxEntropy: number;
        unique: number;
        [key: string]: any
    };
    distribution: Array<{ memberName: string; count: number }>;
    disable?: boolean;
}

export interface IFieldMetaWithExtSuggestions extends IFieldMeta {
    extSuggestions: FieldExtSuggestion[];
    stage?: 'preview' | 'settled';
}

export enum IComputeMode {
    server = 'server',
    worker = 'worker'
}

export interface PreferencePanelConfig {
    aggregator: Aggregator;
    defaultAggregated: boolean;
    defaultStack: boolean;
    zoom: boolean;
    resize: IResizeMode;
    debug: boolean;
    resizeConfig: {
        width: number;
        height: number;
    },
    visMode: 'common' | 'dist';
    nlg: boolean;
    excludeScaleZero: boolean;
    viewSizeLimit: {
        dimension: number;
        measure: number;
    }
}
export interface IDBFieldMeta {
    fid: string;
    dataType: string;
}

export type IECStatus = 'client' | 'proxy' | 'engine';

export interface ISyncEngine {
    fields: IFieldSummary[];
    dataSource: IRow[];
    insightSpaces: IInsightSpace[]
}

export interface IDatasetBase {
    dataSource: IRow[];
    fields: IMuteFieldBase[];
    error?: string;
}

export enum IDataPreviewMode {
    meta = 'meta',
    data = 'data',
    stat = 'stat'
}

export enum ITaskTestMode {
    local = 'local',
    server = 'server'
}

export enum IResizeMode {
    auto = 'auto',
    control = 'control'
}

export type { IFilter }

export type CleanMethod = 'dropNull' | 'useMode' | 'simpleClean' | 'none';

export enum IDataPrepProgressTag {
    none = 'none',
    upload = 'upload',
    filter = 'filter',
    clean = 'clean'
}

export interface IVegaChannel {
    field: string;
    title?: string;
    type: ISemanticType;
    aggregate?: string;
    order?: any;
    bin?: boolean;
    [key: string]: any;
}

// export type IVegaSubset = NormalizedFacetSpec & NormalizedUnitSpec;
export interface IVegaSubset {
    [key: string]: any;
    mark: AnyMark;
    encoding: {
        x?: IVegaChannel;
        y?: IVegaChannel;
        color?: IVegaChannel;
        opacity?: IVegaChannel;
        row?: IVegaChannel;
        column?: IVegaChannel;
        size?: IVegaChannel;
        shape?: IVegaChannel;
    }
}

export enum IVisSpecType {
    vegaSubset = 'vegaSubset',
    vegaLite = 'vegaLite',
    vega = 'vega'
}
export interface IInsightVizView {
    viewId: string;
    specType: IVisSpecType;
    spec: IVegaSubset;
    fields: IFieldMeta[];
    filters: IFilter[];
    score?: number;
    title?: string;
    desc?: string;
}

export enum PAINTER_MODE {
    COLOR = 'color',
    ERASE = 'clean',
    CREATE = 'create',
    MOVE = 'move'
}

export interface IDataFrame {
    [key: string]: any[]
}

export type IResponse<T> = (
    | {
        success: true;
        data: T;
    }
    | {
        success: false;
        message: string;
        error?: {
            code: `ERR_${Uppercase<string>}`;
            options?: Record<string, string>;
        };
    }
);

export interface IteratorStorageMetaInfo {
    versionCode: number;
    length: number;
}

export interface IBackUpDataMeta {
    mutFields: IRawField[],
    extFields: IExtField[],
    rawDataMetaInfo: IteratorStorageMetaInfo,
    filters: IFilter[];
    cleanMethod: string;
}

export interface IBackUpData {
    rawData: any[][];
    extData: [string, ICol<any>][]
}
export interface IRawFeatures {
    fid: string;
    valid: number;
    unique: number;
    missing: number;
    mismatch: number;
}

export type ISpecSourceType = 'default' | 'custom';

export enum DataSourceType {
    File = 1,
    Database = 2,
    Olap = 3,
    AirTable = 4,
    Restful = 5,
    Unknown = 6,
}

export type IDatasetData = {
    data: IBackUpData;
    meta: IBackUpDataMeta;
};

export interface IVisView {
    spec: IVegaSubset | null;
    dataViewQuery: IPattern | null;
}

export interface IDashboardFieldMeta {
    fId: string;
    analyticType: IAnalyticType;
    semanticType: ISemanticType;
    description: string;
}

export interface IDashboardDocumentInfo {
    id: string;
    name: string;
    description: string;
    meta: IDashboardFieldMeta[];
    size: number;
    type: number;
    storageId: string;
    downloadUrl: string;
    cover: {
        name: string;
        size: number;
        type: string;
        storageId: string;
        downloadUrl: string;
    };
}

export interface ILoginForm {
    userName: string;
    password: string;
    email: string;
}

export interface IWorkspace {
    readonly id: string;
    readonly name: string;
}

export interface IOrganization {
    readonly name: string;
    readonly id: string;
    /** `0` stands for personal organization */
    readonly organizationType: number;
    readonly userType: number;
    workspaces?: readonly IWorkspace[] | null | undefined;
}

export interface IUserInfo {
    userName: string;
    email: string;
    eduEmail: string;
    phone: string;
    avatarURL: string;
    organizations?: readonly IOrganization[] | undefined;
}
