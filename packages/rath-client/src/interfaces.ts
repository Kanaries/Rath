// define new interfaces here, global.ts is no longer maintained.
import { AnyMark } from "vega-lite/build/src/mark";
import { IAnalyticType, IFieldSummary, IInsightSpace, ISemanticType } from "visual-insights";
import { IFilter } from '@kanaries/loa'
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
    | `LaTiao.$${string}`
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

interface IFieldExtInfoBaseLaTiao extends IFieldExtInfoBase {
    extOpt: `LaTiao.$${string}` | 'dateTimeExpand';
    extInfo: any;
}

type FieldExtInfoBase = (
    | IFieldExtInfoBaseDateTime
    | IFieldExtInfoBaseLaTiao
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

export enum IAccessMethod {
    PHONE = "phone",
    EMAIL = "email",
    PASSWORD = "password",
}

export enum IAccessPageKeys {
    LOGIN = "login",
    SIGNUP = "signup",
}

export interface IResponse<T = void> {
    success: boolean;
    data: T;
    message?: string;
}
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

export enum CloudAccessModifier {
    PUBLIC = 1,
    PROTECTED = 2,
}

export enum DataSourceType {
    File = 1,
    Database = 2,
    Olap = 3,
    AirTable = 4,
    Restful = 5,
    Unknown = 6,
}

export type ICreateDataSourcePayload<Mode extends 'online' | 'offline'> = {
    name: string;
    datasourceType: DataSourceType;
} & (
    Mode extends 'online' ? {
        linkInfo: Record<string, any>;
    } : {
        fileInfo: {
            fileType?: string;
            fileName: string;
            /** bytes */
            fileSize: number;
        };
    }
);

export type ICreateDataSourceResult<Mode extends 'online' | 'offline'> = {
    id: string;
    name: string;
    type: CloudAccessModifier;
} & (
    Mode extends 'online' ? {
        linkInfo: Record<string, any>;
    } : {
        fileInfo: {
            storageId: string;
            fileType: string;
            fileName: string;
            /** bytes */
            fileSize: number;
            uploadUrl: string;
        };
    }
);

export interface IDatasetFieldMeta {
    name: string;
    fid: string;
    semanticType: ISemanticType;
    analyticType: IAnalyticType;
    geoRole: IGeoRole;
    features: IFieldMeta['features'];
}

export interface IDataSourceMeta {
    id: string;
    name: string;
    type: DataSourceType;
    fileInfo?: {
        storageId: number;
        fileType: string;
        fileName: string;
        /** bytes */
        fileSize: number;
        download_url: string;
    };
    createAt: number;
}

export type ICreateDatasetPayload = {
    /** declared -> overwrite; undeclared -> create; */
    id?: string;
    datasourceId: string;
    name: string;
    workspaceName: string;
    type: CloudAccessModifier;
    /** bytes */
    size: number;
    totalCount: number;
    meta: IDatasetFieldMeta[];
};

export type ICreateDatasetResult = {
    datasetId: string;
    storageId: string;
    uploadUrl: string;
};

export type IDatasetMeta = {
    id: string;
    name: string;
    type: CloudAccessModifier;
    size: number;
    totalCount: number;
    meta: IDatasetFieldMeta[];
    datasource: {
        id: string;
        name: string;
    };
    organization: {
        id: string;
        name: string;
    };
    workspace: {
        id: string;
        name: string;
    };
    createAt: number;
    downloadUrl: string;
};

export type IDatasetData = {
    data: IBackUpData;
    meta: IBackUpDataMeta;
};

export interface ICreateDashboardPayload {
    datasourceId: string;
    workspaceName: string;
    name: string;
    publishTemplate: boolean;
    description: string;
    cover: {
        name: string;
        size: number;
        type: string;
    };
    dashboard: {
        name: string;
        size: number;
        type: string;
    };
}

export interface IDashboardFieldMeta {
    fId: string;
    analyticType: IAnalyticType;
    semanticType: ISemanticType;
    description: string;
}

export interface IDashboardTemplateInfo {
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
    workspace: {
        id: string;
        name: string;
        ownerName: string;
    };
    organization: {
        id: string;
        type: number;
        name: string;
        ownerName: string;
    };
}


export interface IDashboardDocumentDetail {
    id: string;
    name: string;
    type: number;
    description: string;
    dashboardTemplate: Omit<IDashboardTemplateInfo, 'workspace' | 'organization'>;
    workspace: {
        id: string;
        name: string;
        ownerName: string;
    };
    organization: {
        id: string;
        type: number;
        name: string;
        ownerName: string;
    };
    datasource: Pick<IDataSourceMeta, 'name' | 'id'>;
}

export type IDashboardDocumentInfo = IDashboardDocumentDetail['dashboardTemplate'];

export type ICreateDashboardConfig = {
    dashboard: {
        name: string;
        description: string;
        bindDataset: boolean;
    };
    dashboardTemplate: {
        name: string;
        description: string;
        fieldDescription: Record<string, string>;
        publish: boolean;
        cover?: File;
    };
};
