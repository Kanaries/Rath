import { Context } from "koa";
import fs from 'fs/promises';
import path from 'path';
import { IAPP_CONFIG } from "./interfaces";
import { createHash } from 'crypto';

export async function sendSuccessResponse(ctx: Context, payload: any) {
    ctx.body = {
        success: true,
        data: payload
    }
}

export async function sendPureResponse(ctx: Context, payload: any) {
    ctx.body = payload
}

export async function sendFailResponse(ctx: Context, payload: any) {
    ctx.body = {
        success: false,
        message: payload
    }
    ctx.status = 500
}

// export async function createDBConnection () {
//     const store = useGlobalStore();
//     const config = store.getConfig();
//     const connection = await createConnection(config.database.mysql);
//     return connection;
// }

/**
 * 获取应用的配置，这个后续可能是用过一个远程的异步服务获取，目前先从本地文件加载.
 */
export async function getAppConfig (): Promise<IAPP_CONFIG> {
    const filePath = path.resolve(__dirname, '../app-config.json');
    const dataBuffer = await fs.readFile(filePath);
    const data = JSON.parse(dataBuffer.toString()) as IAPP_CONFIG;
    return data;
}

export function passwordHash (password: string) {
    const hash = createHash('sha256');
    hash.update(password + ':entropy')
    return hash.digest('hex');
}
