export declare type ISemanticType = 'quantitative' | 'nominal' | 'ordinal' | 'temporal';
export declare type IDataType = 'number' | 'integer' | 'boolean' | 'date' | 'string';
export declare type IAnalyticType = 'dimension' | 'measure';

export interface IRow {
    [key: string]: any
}

export type IFilter = {
    fid: string;
    disable?: boolean;
    type: 'set';
    values: any[]
} | {
    fid: string;
    disable?: boolean;
    type: 'range';
    range: [number, number]
}

export type IGeoRole = 'longitude' | 'latitude' | 'none';

/** Detailed information of a extended field.  */
interface IFieldExtInfoBase {
    /** Field id of fields that this field infered from.  */
    extFrom: string[];
    /** The identifier of the data-extension operation. */
    extOpt: string;
    /** Additional information of the specified extension operation */
    extInfo: any;
}

interface IFieldBase {
    fid: string;
    name?: string;
    analyticType: IAnalyticType;
    semanticType: ISemanticType;
    geoRole: IGeoRole;
    /** detailed information of field extension operations. defined only if this field is extended */
    extInfo?: IFieldExtInfoBase;
}
export interface IRawField extends IFieldBase {
    disable?: boolean;
    pfid?: string | null;
}