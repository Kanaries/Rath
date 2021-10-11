import Router from '@koa/router';
// import { UserController } from './controllers/user';
import {
    CHGeneralProxy,
    CHDBListProxy,
    CHSampleData,
    CHTableDescProxy,
    CHTableListProxy
} from './controllers/clickHouseProxy';
import { ping } from './controllers/ping';
const router = new Router();

router.get('/ping', ping);
router.get('/api/ch/general', CHGeneralProxy);
router.post('/api/ch/general', CHGeneralProxy);

router.get('/api/ch/dbs', CHDBListProxy);
router.get('/api/ch/sampleData', CHSampleData);
router.get('/api/ch/tables', CHTableListProxy);

// router.post('/api/login', UserController.login);
// router.post('/api/register', UserController.register);
// router.post('/api/userUnique', UserController.isUserExisted);
// router.post('/api/sendMailCert', UserController.requireEmailCert);
// router.get('/api/logout', UserController.logout)

export {
    router
}