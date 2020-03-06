import * as Cluster from './cluster/index';
import { KNN } from './classification/knn';
import { IsolationForest } from './outlier/isolationForest';

const Outier = {
  IsolationForest
}

const Classification = {
  KNN
}

export {
  Cluster,
  Outier,
  Classification
}