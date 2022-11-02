// todo replace the deepcopy with a safe and faster one.
export default function deepcopy<T = any>(dataSource: T): T {
  return JSON.parse(JSON.stringify(dataSource))
}
export function shallowCopyArray<T = any> (arr: T[]): T[] {
  const ans: T[] = [];
  for (let i = 0; i < arr.length; i++) {
      ans.push(arr[i])
  }
  return ans;
}