import axios from "axios";
import { Context } from "koa";
import { useGlobalStore } from "../store";
import { sendFailResponse, sendSuccessResponse } from "../utils";

export async function connectionTest(ctx: Context) {
    try {
        let { user, password } = ctx.request.body || {};
        // clickhouse default connection: user=default, password=''
        if (user === '' || user === undefined) {
            user = 'default'
        }
        const config = useGlobalStore().getConfig();
        const res = await axios(`${config.clickhouse.protocol}://${config.clickhouse.host}:${config.clickhouse.port}`, {
            method: 'post',
            params: {
                user,
                password,
                query: 'select 1'
            }
        });
        if (res.status === 200) {
            sendSuccessResponse(ctx, true)
        } else {
            throw new Error('connection to clickhouse failed.')
        }
    } catch (error) {
        sendFailResponse(ctx, error);
    }
}