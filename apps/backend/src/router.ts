import getInsightViews from './controllers/getInsightViews';
import fieldsAnalysis from './controllers/fieldsAnalysis';
import fieldsSummary from './controllers/fieldsSummary';
import groupFields from './controllers/groupFields';
import combineFields from './controllers/combineFields';
import cluster from './controllers/cluster';
import generateDashBoard from './controllers/dashboard';
import { RequestHandler } from 'express';

interface Route {
  url: string;
  method: 'post' | 'get',
  controller: RequestHandler
}

const router: Route[] = [
  {
    url: '/api/service/getInsightViews',
    method: 'post',
    controller: getInsightViews
  },
  {
    url: '/api/service/fieldsAnalysis',
    method: 'post',
    controller: fieldsAnalysis
  },
  {
    url: '/api/service/fieldsSummary',
    method: 'post',
    controller: fieldsSummary
  },
  {
    url: '/api/service/groupFields',
    method: 'post',
    controller: groupFields
  },
  {
    url: '/api/service/combineFields',
    method: 'post',
    controller: combineFields
  },
  {
    url: '/api/service/clusterMeasures',
    method: 'post',
    controller: cluster
  },
  {
    url: '/api/service/generateDashBoard',
    method: 'post',
    controller: generateDashBoard
  }
]

export default router;