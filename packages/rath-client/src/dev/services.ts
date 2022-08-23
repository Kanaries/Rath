import { IRow } from "visual-insights";
import { IRawField } from "rath-client/src/interfaces";
import { workerService } from "rath-client/src/service";
/* eslint import/no-webpack-loader-syntax:0 */
// @ts-ignore
// eslint-disable-next-line
import ExpandDateTimeWorker from './workers/dateTimeExpand.worker.js?worker';
import { dateTimeExpand } from './workers/engine/dateTimeExpand'

interface ExpandDateTimeProps {
  dataSource: IRow[];
  fields: IRawField[];
}
export async function expandDateTimeService(props: ExpandDateTimeProps): Promise<ExpandDateTimeProps> {
  if (process.env.NODE_ENV === 'development') {
    let res = dateTimeExpand(props) as ExpandDateTimeProps
    return res
  }
  else {
    try {
      const worker = new ExpandDateTimeWorker()
      const result = await workerService<ExpandDateTimeProps, ExpandDateTimeProps>(worker, props)
      worker.terminate();
      if (result.success) {
        return result.data
      }
      else {
        throw new Error(`[ExpandDateTimeWorker]: ${result.message}`)
      }
    } catch (error) {
      console.error(`[ExpandDateTimeWorker]: ${error}`)
      throw error;
    }
  }
}