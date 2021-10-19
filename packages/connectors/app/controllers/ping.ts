import { Context } from "koa";
import { sendSuccessResponse } from "../utils";

export async function ping(ctx: Context) {
    sendSuccessResponse(ctx, true);
}