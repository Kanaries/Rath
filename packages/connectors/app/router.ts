import Router from '@koa/router';
// import { UserController } from './controllers/user';
import { CHSelectProxy } from './controllers/clickHouseProxy';
const router = new Router();

router.get('/api/clickhouse/select', CHSelectProxy);

// router.post('/api/login', UserController.login);
// router.post('/api/register', UserController.register);
// router.post('/api/userUnique', UserController.isUserExisted);
// router.post('/api/sendMailCert', UserController.requireEmailCert);
// router.get('/api/logout', UserController.logout)

export {
    router
}