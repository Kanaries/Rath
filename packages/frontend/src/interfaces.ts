// define new interfaces here, global.ts is no longer maintained.
import { BIField, BIFieldType, FieldType } from "./global";

export interface IRow {
    [key: string]: number | string | boolean | null | undefined;
}

export interface IRawField extends BIField {
    disable: boolean;
}

export interface IFieldMeta extends IFieldBase {
    /**
     * 性质上是计算属性，只读。
     */
    features: {
        entropy: number;
        maxEntropy: number;
        [key: string]: any
    };
    distribution: Array<{ memberName: string; count: number }>;
}

export enum IComputeMode {
    server = 'server',
    worker = 'worker'
}

export type IAnalyticType = 'dimension' | 'measure';