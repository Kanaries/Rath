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

function linearCongruentialGenerator (size: number, seed: number): number[] {
  if (size === 0) return [];
  const m = 2147483647;
  const a = 1103515245;
  const c = 12345;
  let ans: number[] = [seed];
  for (let i = 1; i < size; i++) {
    ans.push(((ans[i - 1] * a + c) % m));
  }
  return ans.map(v => v / m);
}
export function uniformSampling (dataSource: DataSource, size: number): DataSource {
  let sampleIndexes: number[] = linearCongruentialGenerator(size, Math.random() * 2147483647);
  let ans: DataSource = [];
  for (let i = 0; i < size; i++) {
    let index = Math.floor(sampleIndexes[i] * size) % size;
    ans.push(dataSource[index]);
  }
  return ans;
}