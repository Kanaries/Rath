import { DataSource } from "pivot-chart";
import { QueryPath } from "pivot-chart/build/utils";

export function reorder(
  list: any[],
  originalIndex: number,
  targetIndex: number
): any[] {
  const nextList = [...list];
  nextList.splice(originalIndex, 1);
  nextList.splice(targetIndex, 0, list[originalIndex]);
  return nextList;
}

export interface movedLists {
  originList: any[];
  targetList: any[];
}

export function move(
  originalList: any[],
  originIndex: number,
  targetList: any[],
  targetIndex: number
): movedLists {
  let newOriginalList = [...originalList];
  let [removed] = newOriginalList.splice(originIndex, 1);
  let newTargetList = [...targetList];
  newTargetList.splice(targetIndex, 0, removed);
  return {
    originList: newOriginalList,
    targetList: newTargetList,
  };
}
const SPLITOR_IN_VI = '=;=';
export async function buildCubePool(
  dimensionGroups: string[][],
  measures: string[],
  cubeQuery: (path: QueryPath, measures: string[]) => Promise<DataSource>
): Promise<Map<string, DataSource>> {
  let cubePool: Map<string, DataSource> = new Map();
  for (let group of dimensionGroups) {
    const key = group.join(SPLITOR_IN_VI);
    if (!cubePool.has(key)) {
      const path: QueryPath = group.map(dim => ({ dimCode: dim, dimValue: '*' }))
      const viewData = await cubeQuery(path, measures)
      cubePool.set(key, viewData);
    }
  }
  return cubePool;
}
