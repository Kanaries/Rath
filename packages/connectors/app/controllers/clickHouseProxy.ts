import { Context } from "koa";
import axios from 'axios';
import { useGlobalStore } from "../store";
import { sendFailResponse, sendSuccessResponse } from "../utils";

interface CHProxyProps {
    [key: string]: string
}
export async function CHSelectProxy (ctx: Context) {
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