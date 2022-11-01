import Koa from 'koa';
import koaBody from 'koa-body';
import cors from '@koa/cors';
import http2 from 'http2';
// import http from 'http';
import fs from 'fs';
import path from 'path';
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
        const serverKey = fs.readFileSync(path.resolve(__dirname, '../security/cert.key'), 'utf-8')
        const serverCert = fs.readFileSync(path.resolve(__dirname, '../security/cert.pem'), 'utf-8')
        http2.createSecureServer({
            key: serverKey,
            cert: serverCert
        }, app.callback()).listen(config.port, () => {
            console.log(`[Connectors Server Started] running on port: ${config.port}.`)
        });
    } catch (error) {
        console.error('应用启动失败', error)
    }
    
}

start();