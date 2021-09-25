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
        port: number
    }
}