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