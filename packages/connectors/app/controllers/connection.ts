import axios from "axios";
import { Context } from "koa";
import { IAPP_CONFIG } from "../interfaces";
import { useGlobalStore } from "../store";
import { sendFailResponse, sendSuccessResponse } from "../utils";

export async function connectionTest(ctx: Context) {
    try {
        const store = useGlobalStore();
        const defaultConfig = store.getConfig();
        let {
            user,
            password,
            port,
            protocol = defaultConfig.clickhouse.protocol,
            host = defaultConfig.clickhouse.host
        } = ctx.request.body || {};
        // clickhouse default connection: user=default, password=''
        if (user === '' || user === undefined) {
            user = 'default'
        }
        await store.setConfig({
            port: defaultConfig.port,
            clickhouse: {
                user,
                password,
                protocol,
                host,
                port
            }
        });
        const res = await axios(`${protocol}://${host}:${port}`, {
            method: 'post',
            params: {
                user,
                password,
                query: 'select 1'
            }
        });
        if (res.status === 200) {
            await store.setConfig({
                port: defaultConfig.port,
                clickhouse: {
                    user,
                    password,
                    protocol,
                    host,
                    port
                }
            });
            sendSuccessResponse(ctx, true)
        } else {
            throw new Error('connection to clickhouse failed.')
        }
    } catch (error) {
        
        sendFailResponse(ctx, `${error}`);
    }
}

export async function setConnectionConfig (ctx: Context) {
    try {
        const store = useGlobalStore();
        const defaultConfig = store.getConfig();
        const props: IAPP_CONFIG = ctx.request.body || defaultConfig;
        await store.setConfig(props);
        const config = await store.syncConfig();
        sendSuccessResponse(ctx, config);
    } catch (error) {
        sendFailResponse(ctx, `${error}`)       
    }
}

export async function getConnectionConfig (ctx: Context) {
    try {
        const store = useGlobalStore();
        sendSuccessResponse(ctx, store.getConfig())
    } catch (error) {
        sendFailResponse(ctx, `${error}`)
    }
}