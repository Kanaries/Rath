import Koa from 'koa';
import koaBody from 'koa-body';
import cors from '@koa/cors';
import { router } from './router';
import { getAppConfig } from './utils';
import { GlobalStore, updateGlobalStore } from './store';

async function start () {
    try {
        const config = await getAppConfig();
        updateGlobalStore(new GlobalStore(config));

        const app = new Koa();
        app.use(cors({
            credentials: true,
            allowMethods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'PATCH', 'OPTIONS']
        }))

        app.use(koaBody());

        app.use(router.routes());
        app.listen(config.port, () => {
            console.log(`[server started] running on port: ${config.port}.`)
        });
    } catch (error) {
        console.error('应用启动失败', error)
    }
    
}

start();