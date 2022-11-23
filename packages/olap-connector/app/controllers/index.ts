import { Context } from "koa";

export function indexPage (ctx: Context) {
    ctx.body = `<div>
        <h1>Connectors Service is Running!</h1>
    </div>`
    ctx.status = 200;
}