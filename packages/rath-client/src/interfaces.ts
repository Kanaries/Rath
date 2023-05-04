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
    comment?: string;
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
    comment?: string;
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
    comment?: string;
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

export enum PlanRuleType {
    Trueness = 1,
    AmountLimited = 2,
    SizeLimited = 3,
}

export type IPlanRule<RuleType extends PlanRuleType = PlanRuleType> = {
    /** Rule ID, differs in different server area */
    ruleId: string;
    /** Rule name, keeps the same in different server area */
    ruleName: string;
    /**
     * Display content.
     * 
     * May has a `"{limit}"` placeholder, which will be replaced by the `ruleLimit` field formatted according to the `ruleType`.
     */
    ruleDescription: string;
} & (
    RuleType extends PlanRuleType.Trueness ? {
        /** @deprecated This field makes no sense */
        ruleLimit: number;
        /** This rule has no "limit" field */
        ruleType: PlanRuleType.Trueness;
    } : RuleType extends PlanRuleType.AmountLimited ? {
        /** Amount limit of this rule, integer */
        ruleLimit: number;
        /** This rule has a countable "limit" field */
        ruleType: PlanRuleType.AmountLimited;
    } : RuleType extends PlanRuleType.SizeLimited ? {
        /** Size limit of this rule in **byte**, integer */
        ruleLimit: number;
        /** This rule has a sizeable "limit" field */
        ruleType: PlanRuleType.SizeLimited;
    } : never
);

export interface IPlan {
    planId: string;
    /** Name to display */
    name: string;
    /**
     * Subscriber cannot downgrade the plan.
     * It can also be used to sort plan items in an ascending order.
     */
    planLevel: number;
    currency: "usd" | string;
    interval: "month";
    intervalCount: number;
    /**
     * Origin price. Amount in cent (1/100), integer.
     * 
     * When `price` equals to -1, it means a "custom" price and should display a 'contact us' action button.
     */
    price: number;
    /** Available features */
    rules: IPlanRule[];
}
