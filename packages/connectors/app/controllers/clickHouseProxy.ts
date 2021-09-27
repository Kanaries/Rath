import { Context } from "koa";
import axios from 'axios';
import { useGlobalStore } from "../store";
import { sendFailResponse, sendSuccessResponse } from "../utils";

interface CHProxyProps {
    [key: string]: string
}

async function CHQuery (sql: string): Promise<string> {
    const config = useGlobalStore().getConfig();
    const res = await axios(`${config.clickhouse.protocol}://${config.clickhouse.host}:${config.clickhouse.port}?query=${sql}`);
    console.log('res data', res.data)
    return res.data;
}

export async function CHGeneralProxy (ctx: Context) {
    // const props = ctx.request.body as CHProxyProps;
    // http://localhost:8123?query=SELECT * from datasets.suicideRate;
    const config = useGlobalStore().getConfig();
    const url = ctx.request.URL;
    console.log(url);
    try {
        const res = await axios(`${config.clickhouse.protocol}://${config.clickhouse.host}:${config.clickhouse.port}${url.search}`);
        sendSuccessResponse(ctx, res.data)
    } catch (error) {
        console.error(error);
        sendFailResponse(ctx, error)
    }
}

export async function CHDBListProxy (ctx: Context) {
    try {
        const rawData = await CHQuery('SHOW DATABASES;')
        const list = rawData.split('\n').slice(1);
        sendSuccessResponse(ctx, list)
    } catch (error) {
        console.error(error);
        sendFailResponse(ctx, error);
    }
}

export async function CHTableListProxy (ctx: Context) {
    try {
        const rawData = await CHQuery('SHOW TABLES FROM DATASETS;')
        const list = rawData.split('\n');
        sendSuccessResponse(ctx, list)
    } catch (error) {
        console.error(error);
        sendFailResponse(ctx, error);
    }
}

export async function CHTableDescProxy (ctx: Context) {
    try {
        const url = ctx.request.URL;
        const tableName = url.searchParams.get('table');
        const rawData = await CHQuery(`DESCRIBE TABLE ${tableName}`);
        const list = rawData.split('\n');
        sendSuccessResponse(ctx, list)
    } catch (error) {
        console.error(error);
        sendFailResponse(ctx, error);
    }
}

setTimeout(() => {
    CHQuery('describe table datasets.suicideRate;').then(() => {}).catch(console.error);
    CHQuery('show tables from datasets;').then(() => {}).catch(console.error);
}, 3000)
