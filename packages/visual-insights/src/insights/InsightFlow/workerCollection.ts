import { InsightWorker } from "./interfaces"
import { IForestOutlierWorker } from '../workers/IForestOutlier';
import { KNNClusterWorker } from '../workers/KNNCluster';
import { LRTrendWorker } from '../workers/LRTrend';

export enum DefaultIWorker {
  outlier = 'default_outlier',
  // cluster = 'default_group',
  trend = 'default_trend',
}

/**
 * collection of insight workers. it helps to manage all the workers in a centralized way.
 */
export class InsightWorkerCollection {
  public static colletion: InsightWorkerCollection
  private workers: Map<string, [boolean, InsightWorker]>
  private constructor() {
    this.workers = new Map()
  }
  public register(name: string, iWorker: InsightWorker) {
    if (this.workers.has(name)) {
      throw new Error(`There has been a worker named: ${name} already.`)
    } else {
      this.workers.set(name, [true, iWorker])
    }
  }
  /**
   * set a existed worker's status.
   * @param name insight worker's name used for register.
   * @param status whether the worker should be used.
   */
  public enable(name: string, status: boolean) {
    if (!this.workers.has(name)) {
      throw new Error(`Intention Worker "${name}" does not exist.`)
    } else {
      let iWorkerWithStatus = this.workers.get(name)
      iWorkerWithStatus[0] = status
      this.workers.set(name, iWorkerWithStatus)
    }
  }
  /**
   * enumerate all enabled insight workers.
   * @param func (what is going to be done with the given worker)
   */
  public each(func: (iWorker: InsightWorker, name?: string) => void) {
    for (let [name, iWorker] of this.workers) {
      if (iWorker[0]) {
        func(iWorker[1], name)
      }
    }
  }
  public static init(props: { withDefaultIWorkers?: boolean } = { withDefaultIWorkers: true }) {
    const { withDefaultIWorkers = true } = props
    if (!InsightWorkerCollection.colletion) {
      InsightWorkerCollection.colletion = new InsightWorkerCollection()
      if (withDefaultIWorkers) {
        InsightWorkerCollection.colletion.register(DefaultIWorker.outlier, IForestOutlierWorker)
        // InsightWorkerCollection.colletion.register(DefaultIWorker.cluster, KNNClusterWorker)
        InsightWorkerCollection.colletion.register(DefaultIWorker.trend, LRTrendWorker)
      }
    }
    Object.values(DefaultIWorker).forEach(workerName => {
      InsightWorkerCollection.colletion.enable(workerName, withDefaultIWorkers)
    })
    return InsightWorkerCollection.colletion
  }
}
