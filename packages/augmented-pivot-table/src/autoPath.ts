import { NestTree } from "pivot-chart";
import { QueryPath } from "pivot-chart/build/utils";
import { ViewSpace } from "visual-insights/build/esm/insights/dev";
import { Insight } from "visual-insights";

export function enumerateExpandableNode (tree: NestTree, dimensions: string[], each: (path: QueryPath, node: NestTree) => void, end?: () => void) {
  const queue: Array<[NestTree, QueryPath, number]> = [];
  queue.push([tree, [], 0]);
  while(queue.length > 0) {
    const [node, parentPath, depth] = queue.shift();
    const path: QueryPath = [...parentPath];
    const currentDimension = dimensions[depth - 1];
    if (depth >= 1) {
      path.push({
        dimCode: currentDimension,
        dimValue: node.id
      })
    }
    if (node.expanded) {
      if (node.children && node.children.length > 0) {
        for (let child of node.children) {
          queue.push([child, path, depth + 1])
        }
      }
    } else {
      const prePath: QueryPath = [...path];
      if (depth < dimensions.length) {
        prePath.push({
          dimCode: dimensions[depth],
          dimValue: '*'
        });
        each(prePath, node);
      } 
    }
  }
  if (end) {
    end();
  }
}

export function getViewFinalScore(spacesOfOneView: Insight.InsightSpace[]): number {
  let totalSig = spacesOfOneView.map(space => space.significance).reduce((total, val) => total +val);
  totalSig /= spacesOfOneView.length;
  return totalSig;
}
