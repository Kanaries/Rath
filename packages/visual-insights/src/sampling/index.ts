import { DataSource } from "../commonTypes";

/**
 * todo reservoir sampling is better to support stream data
 * Algorithm R:
 * Vitter, Jeffrey S. (1 March 1985). "Random sampling with a reservoir" (PDF). ACM Transactions on Mathematical Software. 11 (1): 37–57. CiteSeerX 10.1.1.138.784. doi:10.1145/3147.3165.
 */
export function reservoirSampling (dataSource: DataSource, size: number | undefined = 500): DataSource {
  if (dataSource.length <= size) return dataSource;
  let sampleSpace: DataSource = dataSource.slice(0, size);
  let len = dataSource.length;
  for (let i = size + 1; i < len; i++) {
    let pos = Math.round(Math.random() * i);
    if (pos < size) {
      sampleSpace[pos] = dataSource[i];
    }
  }
  return sampleSpace;
}
