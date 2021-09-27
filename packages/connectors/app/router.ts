import Router from '@koa/router';
// import { UserController } from './controllers/user';
import { CHGeneralProxy } from './controllers/clickHouseProxy';
const router = new Router();

router.get('/api/clickhouse/general', CHGeneralProxy);

// router.post('/api/login', UserController.login);
// router.post('/api/register', UserController.register);
// router.post('/api/userUnique', UserController.isUserExisted);
// router.post('/api/sendMailCert', UserController.requireEmailCert);
// router.get('/api/logout', UserController.logout)

export {
    router
}