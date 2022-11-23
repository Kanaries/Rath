import { Context } from "koa";
import axios from 'axios';
import { useGlobalStore } from "../store";
import { sendFailResponse, sendPureResponse, sendSuccessResponse } from "../utils";
import { CHQuery, getFieldMetas } from "../services/chmeta";
import { parseTable } from "../services/chparser";
// import fs from 'fs'

interface CHProxyProps {
    [key: string]: string
}

export async function CHGeneralProxy (ctx: Context) {
    // const props = ctx.request.body as CHProxyProps;
    // http://localhost:8123?query=SELECT * from datasets.suicideRate;
    const config = useGlobalStore().getConfig();
    const url = ctx.request.URL;
    try {
        const paramsObj: {[key: string]: any} = {};
        for (let [pk, pv] of url.searchParams.entries()) {
            paramsObj[pk] = pv;
        }
        // console.log('query', paramsObj.query)
        const res = await axios(`${config.clickhouse.protocol}://${config.clickhouse.host}:${config.clickhouse.port}`, {
            method: ctx.request.method as 'post' | 'get',
            params: {
                ...paramsObj,
                user: config.clickhouse.user,
                password: config.clickhouse.password
            }
        });
        sendPureResponse(ctx, res.data);
    } catch (error) {
        console.error(error);
        sendFailResponse(ctx, `${error}`)
    }
}

export async function CHDBListProxy (ctx: Context) {
    try {
        const rawData = await CHQuery('SHOW DATABASES;')
        const list = rawData.slice(0, -1).split('\n').slice(1);
        sendSuccessResponse(ctx, list)
    } catch (error) {
        console.error(error);
        sendFailResponse(ctx, `${error}`);
    }
}

export async function CHTableListProxy (ctx: Context) {
    try {
        const dbName = ctx.request.URL.searchParams.get('dbName');
        let sql = (dbName && dbName !== '') ? `show tables from ${dbName}` : `show tables`;
        const rawData = await CHQuery(sql);
        const list = rawData.slice(0, -1).split('\n');
        sendSuccessResponse(ctx, list)
    } catch (error) {
        console.error(error);
        sendFailResponse(ctx, `${error}`);
    }
}

export async function CHTableDescProxy (ctx: Context) {
    try {
        const url = ctx.request.URL;
        const tableName = url.searchParams.get('table');
        if (tableName) {
            const metas = await getFieldMetas(tableName);
            sendSuccessResponse(ctx, metas)
        } else {
            throw new Error('[table name is empty]')
        }
    } catch (error) {
        console.error(error);
        sendFailResponse(ctx, `${error}`);
    }
}

export async function CHSampleData (ctx: Context) {
    try {
        const url = ctx.request.URL;
        const tableName = url.searchParams.get('table');
        const dbName = url.searchParams.get('dbName');
        const viewName = dbName && dbName !== '' ? `${dbName}.${tableName}` : tableName;
        const rawData = await CHQuery(`select * from ${viewName} limit 1000;`);
        if (viewName) {
            const metas = await getFieldMetas(viewName);
            const data = parseTable(rawData, metas);
            sendSuccessResponse(ctx, {
                data,
                metas
            })
        } else {
            throw new Error('[table name is empty]')
        }
    } catch (error) {
        console.error(error);
        sendFailResponse(ctx, `${error}`);
    }
}

// setTimeout(() => {
//     CHQuery('describe table datasets.suicideRate;').then(() => {}).catch(console.error);
//     CHQuery('show tables from datasets;').then(() => {}).catch(console.error);
// }, 3000)
