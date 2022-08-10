import { Context } from "koa";

export type IService<T = any, R = void> = (ctx: Context, props?: T) => Promise<R>;

export interface IRow {
    [key: string]: any
}

export interface IAPP_CONFIG {
    port: number;
    clickhouse: {
        protocol: string;
        host: string;
        port: number;
        user: string;
        password: string;
    }
}

export interface IDBFieldMeta {
    fid: string;
    dataType: string;
}

export type ISemanticType = 'quantitative' | 'nominal' | 'ordinal' | 'temporal';
export type IDataType = 'number' | 'integer' | 'boolean' | 'date' | 'string';
export type IAnalyticType = 'dimension' | 'measure';
export interface IField {
    key: string;
    name?: string;
    analyticType: IAnalyticType;
    semanticType: ISemanticType;
    dataType: IDataType;
}

export interface IMutField {
    key: string;
    name?: string;
    analyticType: IAnalyticType | '?';
    semanticType: ISemanticType | '?';
    dataType: IDataType | '?';
}