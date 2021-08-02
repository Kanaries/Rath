// define new interfaces here, global.ts is no longer maintained.
import { BIField, BIFieldType, FieldType } from "./global";

export interface IRow {
    [key: string]: number | string | boolean | null | undefined;
}

export interface IRawField extends BIField {
    disable: boolean;
}

export interface IFieldMeta {
    fid: string;
    features: {
        entropy: number;
        maxEntropy: number;
        [key: string]: any
    };
    distribution: Array<{ memberName: string; count: number }>;
    analyticType: BIFieldType;
    semanticType: FieldType
}