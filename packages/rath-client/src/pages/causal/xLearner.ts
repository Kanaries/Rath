import {
  BackgroundKnowledge,
  CausalGraph,
  EDGE_ENDPOINT,
  type FciOptions,
  type FciResult,
  type SeparationSetEntry
} from "@kanaries/causal";

import type { CausalDiscoveryFuncDep } from "./discoveryTypes";

export interface XLearnerOptions extends FciOptions {
  functionalDependencies?: readonly CausalDiscoveryFuncDep[];
}

type SepsetMap = Map<string, number[]>;

interface CountedCiTest {
  test(x: number, y: number, conditioningSet?: readonly number[]): number;
}

function createNodeLabels(variableCount: number, nodeLabels?: readonly string[]): string[] {
  if (!nodeLabels) {
    return Array.from({ length: variableCount }, (_, index) => `X${index + 1}`);
  }

  if (nodeLabels.length !== variableCount) {
    throw new Error(`Expected ${variableCount} node labels, got ${nodeLabels.length}.`);
  }

  return [...nodeLabels];
}

function pairKey(x: number, y: number): string {
  return `${x}:${y}`;
}

function tripleKey(x: number, y: number, z: number): string {
  return `${x}:${y}:${z}`;
}

function undirectedKey(x: number, y: number): string {
  return x < y ? pairKey(x, y) : pairKey(y, x);
}

function parsePairKey(key: string): [number, number] {
  const [left, right] = key.split(":");
  return [Number(left), Number(right)];
}

type FunctionalDependencyEdge = {
  source: number;
  target: number;
};

function normalizeFunctionalDependencies(
  functionalDependencies: readonly CausalDiscoveryFuncDep[] | undefined,
  nodeLabels: readonly string[]
): FunctionalDependencyEdge[] {
  if (!functionalDependencies || functionalDependencies.length === 0) {
    return [];
  }

  const indexByNodeLabel = new Map(nodeLabels.map((label, index) => [label, index]));
  const edges = new Map<string, FunctionalDependencyEdge>();

  for (const dependency of functionalDependencies) {
    if (dependency.params.length !== 1) {
      continue;
    }

    const source = indexByNodeLabel.get(dependency.params[0]?.fid ?? "");
    const target = indexByNodeLabel.get(dependency.fid);
    if (source === undefined || target === undefined || source === target) {
      continue;
    }

    edges.set(`${source}->${target}`, { source, target });
  }

  return [...edges.values()];
}

function cloneBackgroundKnowledge(backgroundKnowledge?: BackgroundKnowledge): BackgroundKnowledge | undefined {
  return backgroundKnowledge ? BackgroundKnowledge.fromShape(backgroundKnowledge.toShape()) : undefined;
}

function topologicalSort(
  nodeIndices: readonly number[],
  adjacency: Map<number, Set<number>>
): number[] {
  const indegree = new Map<number, number>(nodeIndices.map((nodeIndex) => [nodeIndex, 0]));

  for (const source of nodeIndices) {
    for (const target of adjacency.get(source) ?? []) {
      indegree.set(target, (indegree.get(target) ?? 0) + 1);
    }
  }

  const queue = nodeIndices.filter((nodeIndex) => (indegree.get(nodeIndex) ?? 0) === 0).sort((left, right) => left - right);
  const order: number[] = [];

  while (queue.length > 0) {
    const current = queue.shift();
    if (current === undefined) {
      continue;
    }
    order.push(current);

    for (const target of adjacency.get(current) ?? []) {
      const nextIndegree = (indegree.get(target) ?? 0) - 1;
      indegree.set(target, nextIndegree);
      if (nextIndegree === 0) {
        queue.push(target);
        queue.sort((left, right) => left - right);
      }
    }
  }

  for (const nodeIndex of nodeIndices) {
    if (!order.includes(nodeIndex)) {
      order.push(nodeIndex);
    }
  }

  return order;
}

function runSkeletonDiscoveryOnSubset(
  nodeIndices: readonly number[],
  nodeLabels: readonly string[],
  options: XLearnerOptions,
  ciTest: CountedCiTest
): Set<string> {
  if (nodeIndices.length < 2) {
    return new Set<string>();
  }

  const alpha = options.alpha ?? 0.05;
  const stable = options.stable ?? true;
  const depthLimit = options.depth ?? -1;
  const subsetLabels = nodeIndices.map((nodeIndex) => nodeLabels[nodeIndex]!).filter(Boolean);
  const graph = new CausalGraph(subsetLabels.map((id) => ({ id }))).fullyConnect(EDGE_ENDPOINT.tail);
  const skeletonKnowledge = new Set<string>();

  let depth = -1;

  while (graph.getMaxDegree() - 1 > depth && (depthLimit < 0 || depth < depthLimit)) {
    depth += 1;
    const pendingRemoval = new Set<string>();

    for (let localX = 0; localX < nodeIndices.length; localX += 1) {
      const neighborsOfX = graph.neighbors(localX);
      if (neighborsOfX.length < depth) {
        continue;
      }

      for (const localY of neighborsOfX) {
        const nodeX = graph.getNodeIdAt(localX);
        const nodeY = graph.getNodeIdAt(localY);
        if (!graph.isAdjacentTo(nodeX, nodeY)) {
          continue;
        }

        const possibleNeighbors = graph.neighbors(localX).filter((candidate) => candidate !== localY);
        if (possibleNeighbors.length < depth) {
          continue;
        }

        const globalX = nodeIndices[localX]!;
        const globalY = nodeIndices[localY]!;

        for (const conditioningSet of combinations(possibleNeighbors, depth)) {
          const pValue = ciTest.test(
            globalX,
            globalY,
            conditioningSet.map((candidate) => nodeIndices[candidate]!)
          );

          if (pValue <= alpha) {
            continue;
          }

          if (stable) {
            pendingRemoval.add(undirectedKey(localX, localY));
          } else {
            graph.removeEdge(nodeX, nodeY);
            break;
          }
        }
      }
    }

    for (const key of pendingRemoval) {
      const [localX, localY] = parsePairKey(key);
      graph.removeEdge(graph.getNodeIdAt(localX), graph.getNodeIdAt(localY));
    }
  }

  for (const edge of graph.getEdges()) {
    if (edge.endpoint1 !== EDGE_ENDPOINT.tail || edge.endpoint2 !== EDGE_ENDPOINT.tail) {
      continue;
    }

    const left = nodeIndices[graph.getNodeIndex(edge.node1)];
    const right = nodeIndices[graph.getNodeIndex(edge.node2)];
    if (left === undefined || right === undefined) {
      continue;
    }
    skeletonKnowledge.add(undirectedKey(left, right));
  }

  return skeletonKnowledge;
}

function buildFunctionalDependencyEnhancement(
  options: XLearnerOptions,
  nodeLabels: readonly string[],
  ciTest: CountedCiTest
): {
  backgroundKnowledge?: BackgroundKnowledge;
  skeletonKnowledge: Set<string>;
} {
  const normalizedDependencies = normalizeFunctionalDependencies(options.functionalDependencies, nodeLabels);
  const backgroundKnowledge = cloneBackgroundKnowledge(options.backgroundKnowledge) ?? new BackgroundKnowledge();
  const skeletonKnowledge = new Set<string>();

  if (normalizedDependencies.length === 0) {
    return {
      backgroundKnowledge: options.backgroundKnowledge ? backgroundKnowledge : undefined,
      skeletonKnowledge
    };
  }

  const activeNodes = new Set<number>();
  const adjacency = new Map<number, Set<number>>();
  const ancestors = new Map<number, Set<number>>();

  for (const { source, target } of normalizedDependencies) {
    activeNodes.add(source);
    activeNodes.add(target);

    const sourceTargets = adjacency.get(source) ?? new Set<number>();
    sourceTargets.add(target);
    adjacency.set(source, sourceTargets);

    const targetAncestors = ancestors.get(target) ?? new Set<number>();
    targetAncestors.add(source);
    ancestors.set(target, targetAncestors);

    backgroundKnowledge.addRequired(nodeLabels[source]!, nodeLabels[target]!);
  }

  const orderedNodes = topologicalSort([...activeNodes], adjacency);
  for (const target of [...orderedNodes].reverse()) {
    if (!activeNodes.has(target)) {
      continue;
    }

    const candidateAncestors = [...(ancestors.get(target) ?? new Set<number>())].filter((source) => activeNodes.has(source));
    if (candidateAncestors.length > 0) {
      const source = candidateAncestors.reduce((bestSource, candidate) => {
        const bestCardinality = new Set(options.data.column(bestSource)).size;
        const candidateCardinality = new Set(options.data.column(candidate)).size;
        return candidateCardinality > bestCardinality ? candidate : bestSource;
      });
      skeletonKnowledge.add(undirectedKey(source, target));
    }

    activeNodes.delete(target);
    for (const source of candidateAncestors) {
      adjacency.get(source)?.delete(target);
    }
  }

  for (const key of runSkeletonDiscoveryOnSubset([...activeNodes].sort((left, right) => left - right), nodeLabels, options, ciTest)) {
    skeletonKnowledge.add(key);
  }

  return { backgroundKnowledge, skeletonKnowledge };
}

function getSepset(sepsets: SepsetMap, x: number, y: number): number[] | undefined {
  return sepsets.get(pairKey(x, y));
}

function setSepset(sepsets: SepsetMap, x: number, y: number, conditioningSet: readonly number[]): void {
  const normalized = [...conditioningSet].sort((left, right) => left - right);
  sepsets.set(pairKey(x, y), normalized);
  sepsets.set(pairKey(y, x), normalized);
}

function serializeSepsets(sepsets: SepsetMap): SeparationSetEntry[] {
  const uniquePairs = new Set<string>();
  const entries: SeparationSetEntry[] = [];

  for (const [key, conditioningSet] of sepsets.entries()) {
    const [xText, yText] = key.split(":");
    const x = Number(xText);
    const y = Number(yText);
    const canonicalKey = x <= y ? pairKey(x, y) : pairKey(y, x);
    if (uniquePairs.has(canonicalKey)) {
      continue;
    }

    uniquePairs.add(canonicalKey);
    entries.push({
      x,
      y,
      conditioningSets: [[...conditioningSet]]
    });
  }

  return entries;
}

function* combinations(values: readonly number[], size: number): Generator<number[]> {
  if (size === 0) {
    yield [];
    return;
  }

  if (values.length < size) {
    return;
  }

  for (let index = 0; index <= values.length - size; index += 1) {
    const head = values[index];
    if (head === undefined) {
      continue;
    }

    for (const tail of combinations(values.slice(index + 1), size - 1)) {
      yield [head, ...tail];
    }
  }
}

function endpointTowards(graph: CausalGraph, from: string, to: string) {
  return graph.getEndpoint(to, from);
}

function isKnowledgeForbiddenBothWays(
  backgroundKnowledge: BackgroundKnowledge | undefined,
  graph: CausalGraph,
  x: number,
  y: number
): boolean {
  if (!backgroundKnowledge) {
    return false;
  }

  const xId = graph.getNodeIdAt(x);
  const yId = graph.getNodeIdAt(y);
  return backgroundKnowledge.isForbidden(xId, yId) && backgroundKnowledge.isForbidden(yId, xId);
}

function canOrientArrowhead(
  from: string,
  to: string,
  graph: CausalGraph,
  backgroundKnowledge?: BackgroundKnowledge
): boolean {
  if (endpointTowards(graph, from, to) === EDGE_ENDPOINT.arrow) {
    return true;
  }

  if (endpointTowards(graph, from, to) === EDGE_ENDPOINT.tail) {
    return false;
  }

  if (backgroundKnowledge?.isForbidden(from, to) || backgroundKnowledge?.isRequired(to, from)) {
    return false;
  }

  return endpointTowards(graph, from, to) === EDGE_ENDPOINT.circle;
}

function orientEdge(
  graph: CausalGraph,
  node1: string,
  node2: string,
  endpoint1: (typeof EDGE_ENDPOINT)[keyof typeof EDGE_ENDPOINT],
  endpoint2: (typeof EDGE_ENDPOINT)[keyof typeof EDGE_ENDPOINT]
): boolean {
  if (
    graph.getEndpoint(node1, node2) === endpoint1 &&
    graph.getEndpoint(node2, node1) === endpoint2
  ) {
    return false;
  }

  graph.setEdge(node1, node2, endpoint1, endpoint2);
  return true;
}

function reorientAllWith(graph: CausalGraph, endpoint: (typeof EDGE_ENDPOINT)[keyof typeof EDGE_ENDPOINT]): void {
  graph.reorientAllWith(endpoint);
}

function fciOrientByBackgroundKnowledge(
  graph: CausalGraph,
  backgroundKnowledge?: BackgroundKnowledge
): void {
  if (!backgroundKnowledge) {
    return;
  }

  for (const edge of graph.getEdges()) {
    if (backgroundKnowledge.isForbidden(edge.node1, edge.node2)) {
      orientEdge(graph, edge.node2, edge.node1, EDGE_ENDPOINT.tail, EDGE_ENDPOINT.arrow);
      continue;
    }

    if (backgroundKnowledge.isForbidden(edge.node2, edge.node1)) {
      orientEdge(graph, edge.node1, edge.node2, EDGE_ENDPOINT.tail, EDGE_ENDPOINT.arrow);
      continue;
    }

    if (backgroundKnowledge.isRequired(edge.node1, edge.node2)) {
      orientEdge(graph, edge.node1, edge.node2, EDGE_ENDPOINT.tail, EDGE_ENDPOINT.arrow);
      continue;
    }

    if (backgroundKnowledge.isRequired(edge.node2, edge.node1)) {
      orientEdge(graph, edge.node2, edge.node1, EDGE_ENDPOINT.tail, EDGE_ENDPOINT.arrow);
    }
  }
}

function skeletonDiscovery(
  options: FciOptions,
  ciTest: CountedCiTest
): { graph: CausalGraph; sepsets: SepsetMap; maxDepth: number } {
  const alpha = options.alpha ?? 0.05;
  const stable = options.stable ?? true;
  const variableCount = options.data.columns;
  const nodeLabels = createNodeLabels(variableCount, options.nodeLabels);
  const graph = new CausalGraph(nodeLabels.map((id) => ({ id }))).fullyConnect(EDGE_ENDPOINT.tail);
  const sepsets: SepsetMap = new Map();
  const depthLimit = options.depth ?? -1;

  let depth = -1;

  while (graph.getMaxDegree() - 1 > depth && (depthLimit < 0 || depth < depthLimit)) {
    depth += 1;
    const pendingRemoval = new Map<string, Set<number>>();

    for (let x = 0; x < variableCount; x += 1) {
      const neighborsOfX = graph.neighbors(x);
      if (neighborsOfX.length < depth) {
        continue;
      }

      for (const y of neighborsOfX) {
        if (!graph.isAdjacentTo(graph.getNodeIdAt(x), graph.getNodeIdAt(y))) {
          continue;
        }

        const stableSepset = new Set<number>();

        if (isKnowledgeForbiddenBothWays(options.backgroundKnowledge, graph, x, y)) {
          if (stable) {
            const key = x <= y ? pairKey(x, y) : pairKey(y, x);
            pendingRemoval.set(key, pendingRemoval.get(key) ?? stableSepset);
          } else {
            graph.removeEdge(graph.getNodeIdAt(x), graph.getNodeIdAt(y));
            setSepset(sepsets, x, y, []);
          }
        }

        const possibleNeighbors = graph.neighbors(x).filter((candidate) => candidate !== y);
        if (possibleNeighbors.length < depth) {
          continue;
        }

        for (const conditioningSet of combinations(possibleNeighbors, depth)) {
          const pValue = ciTest.test(x, y, conditioningSet);
          if (pValue > alpha) {
            if (stable) {
              const key = x <= y ? pairKey(x, y) : pairKey(y, x);
              const mergedSet = pendingRemoval.get(key) ?? stableSepset;
              for (const value of conditioningSet) {
                mergedSet.add(value);
              }
              pendingRemoval.set(key, mergedSet);
            } else {
              graph.removeEdge(graph.getNodeIdAt(x), graph.getNodeIdAt(y));
              setSepset(sepsets, x, y, conditioningSet);
              break;
            }
          }
        }
      }
    }

    for (const [key, conditioningSet] of pendingRemoval.entries()) {
      const [xText, yText] = key.split(":");
      const x = Number(xText);
      const y = Number(yText);
      graph.removeEdge(graph.getNodeIdAt(x), graph.getNodeIdAt(y));
      setSepset(sepsets, x, y, [...conditioningSet]);
    }
  }

  return { graph, sepsets, maxDepth: depth };
}

function findPagAdjacencies(graph: CausalGraph): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];
  for (let from = 0; from < graph.size; from += 1) {
    for (const to of graph.neighbors(from)) {
      pairs.push([from, to]);
    }
  }
  return pairs;
}

function findPagUnshieldedTriples(graph: CausalGraph): Array<[number, number, number]> {
  const triples: Array<[number, number, number]> = [];
  const adjacencies = findPagAdjacencies(graph);

  for (const [i, j] of adjacencies) {
    for (const [j2, k] of adjacencies) {
      if (j !== j2 || i === k || graph.isAdjacentTo(graph.getNodeIdAt(i), graph.getNodeIdAt(k))) {
        continue;
      }
      triples.push([i, j, k]);
    }
  }

  return triples;
}

function isUncoveredPath(path: readonly string[], graph: CausalGraph): boolean {
  for (let index = 0; index < path.length - 2; index += 1) {
    const left = path[index];
    const right = path[index + 2];
    if (left && right && graph.isAdjacentTo(left, right)) {
      return false;
    }
  }
  return true;
}

function traverseSemiDirected(node: string, neighbor: string, graph: CausalGraph): string | undefined {
  const endpoint = graph.getEndpoint(node, neighbor);
  return endpoint === EDGE_ENDPOINT.tail || endpoint === EDGE_ENDPOINT.circle ? neighbor : undefined;
}

function traversePotentiallyDirected(node: string, neighbor: string, graph: CausalGraph): string | undefined {
  const endpointAtNode = graph.getEndpoint(node, neighbor);
  const endpointAtNeighbor = graph.getEndpoint(neighbor, node);
  if (
    (endpointAtNode === EDGE_ENDPOINT.tail || endpointAtNode === EDGE_ENDPOINT.circle) &&
    (endpointAtNeighbor === EDGE_ENDPOINT.arrow || endpointAtNeighbor === EDGE_ENDPOINT.circle)
  ) {
    return neighbor;
  }
  return undefined;
}

function traverseCircle(node: string, neighbor: string, graph: CausalGraph): string | undefined {
  return graph.isCircleEdge(node, neighbor) ? neighbor : undefined;
}

function existsSemiDirectedPath(graph: CausalGraph, nodeFrom: string, nodeTo: string): boolean {
  const queue: string[] = [];
  const visited = new Set<string>();

  for (const neighbor of graph.getAdjacentNodeIds(nodeFrom)) {
    const next = traverseSemiDirected(nodeFrom, neighbor, graph);
    if (!next || visited.has(next)) {
      continue;
    }
    visited.add(next);
    queue.push(next);
  }

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }
    if (current === nodeTo) {
      return true;
    }

    for (const neighbor of graph.getAdjacentNodeIds(current)) {
      const next = traverseSemiDirected(current, neighbor, graph);
      if (!next || visited.has(next)) {
        continue;
      }
      visited.add(next);
      queue.push(next);
    }
  }

  return false;
}

function existsUncoveredPdPath(
  graph: CausalGraph,
  nodeFrom: string,
  nodeNext: string,
  nodeTo: string
): boolean {
  const queue: Array<{ current: string; path: string[] }> = [];
  const visited = new Set<string>([nodeFrom, nodeNext]);

  for (const neighbor of graph.getAdjacentNodeIds(nodeNext)) {
    const next = traversePotentiallyDirected(nodeNext, neighbor, graph);
    if (!next || visited.has(next)) {
      continue;
    }
    visited.add(next);
    queue.push({ current: next, path: [nodeFrom, nodeNext, next] });
  }

  while (queue.length > 0) {
    const item = queue.shift();
    if (!item) {
      continue;
    }

    if (item.current === nodeTo && isUncoveredPath(item.path, graph)) {
      return true;
    }

    for (const neighbor of graph.getAdjacentNodeIds(item.current)) {
      const next = traversePotentiallyDirected(item.current, neighbor, graph);
      if (!next || visited.has(next)) {
        continue;
      }
      visited.add(next);
      queue.push({ current: next, path: [...item.path, next] });
    }
  }

  return false;
}

function getUncoveredCirclePaths(
  graph: CausalGraph,
  nodeFrom: string,
  nodeTo: string,
  excludeNodes: readonly string[]
): string[][] {
  const queue: Array<{ current: string; path: string[] }> = [];
  const visited = new Set<string>();
  const excluded = new Set(excludeNodes);
  const results: string[][] = [];

  for (const neighbor of graph.getAdjacentNodeIds(nodeFrom)) {
    if (excluded.has(neighbor)) {
      continue;
    }
    const next = traverseCircle(nodeFrom, neighbor, graph);
    if (!next || visited.has(next)) {
      continue;
    }
    visited.add(next);
    queue.push({ current: next, path: [nodeFrom, next] });
  }

  while (queue.length > 0) {
    const item = queue.shift();
    if (!item) {
      continue;
    }

    if (item.current === nodeTo && isUncoveredPath(item.path, graph)) {
      results.push(item.path);
    }

    for (const neighbor of graph.getAdjacentNodeIds(item.current)) {
      if (excluded.has(neighbor)) {
        continue;
      }
      const next = traverseCircle(item.current, neighbor, graph);
      if (!next || visited.has(next)) {
        continue;
      }
      visited.add(next);
      queue.push({ current: next, path: [...item.path, next] });
    }
  }

  return results;
}

function existOnePathWithPossibleParents(
  previous: Map<string, Set<string>>,
  nodeW: string,
  nodeX: string,
  nodeB: string,
  graph: CausalGraph
): boolean {
  if (nodeW === nodeX) {
    return true;
  }

  const parents = previous.get(nodeW);
  if (!parents) {
    return false;
  }

  for (const nodeR of parents) {
    if (nodeR === nodeB || nodeR === nodeX) {
      continue;
    }

    if (existsSemiDirectedPath(graph, nodeR, nodeX) || existsSemiDirectedPath(graph, nodeR, nodeB)) {
      return true;
    }
  }

  return false;
}

function getPossibleDsep(
  graph: CausalGraph,
  nodeX: string,
  nodeY: string,
  maxPathLength: number
): string[] {
  const dsep = new Set<string>();
  const queue: Array<[string, string]> = [];
  const visited = new Set<string>();
  const previous = new Map<string, Set<string>>();
  let currentLayerEdge: [string, string] | undefined;
  let distance = 0;

  for (const nodeB of graph.getAdjacentNodeIds(nodeX)) {
    if (nodeB === nodeY) {
      continue;
    }

    const edge: [string, string] = [nodeX, nodeB];
    currentLayerEdge ??= edge;
    queue.push(edge);
    visited.add(edge.join("->"));

    const previousNodes = previous.get(nodeX) ?? new Set<string>();
    previousNodes.add(nodeB);
    previous.set(nodeX, previousNodes);
    dsep.add(nodeB);
  }

  while (queue.length > 0) {
    const [nodeA, nodeB] = queue.shift() ?? [];
    if (!nodeA || !nodeB) {
      continue;
    }

    if (currentLayerEdge && currentLayerEdge[0] === nodeA && currentLayerEdge[1] === nodeB) {
      currentLayerEdge = undefined;
      distance += 1;
      if (distance > 0 && distance > (maxPathLength === -1 ? 1000 : maxPathLength)) {
        break;
      }
    }

    if (existOnePathWithPossibleParents(previous, nodeB, nodeX, nodeB, graph)) {
      dsep.add(nodeB);
    }

    for (const nodeC of graph.getAdjacentNodeIds(nodeB)) {
      if (nodeC === nodeA || nodeC === nodeX || nodeC === nodeY) {
        continue;
      }

      const previousNodes = previous.get(nodeC) ?? new Set<string>();
      previousNodes.add(nodeB);
      previous.set(nodeC, previousNodes);

      if (graph.isDefColliderByIds(nodeA, nodeB, nodeC) || graph.isAdjacentTo(nodeA, nodeC)) {
        const step = `${nodeA}->${nodeC}`;
        if (visited.has(step)) {
          continue;
        }

        visited.add(step);
        queue.push([nodeA, nodeC]);
        currentLayerEdge ??= [nodeA, nodeC];
      }
    }
  }

  dsep.delete(nodeX);
  dsep.delete(nodeY);
  return [...dsep].sort((left, right) => right.localeCompare(left));
}

function removeByPossibleDsep(
  graph: CausalGraph,
  ciTest: CountedCiTest,
  alpha: number,
  sepsets: SepsetMap,
  maxPathLength: number
): void {
  const edges = [...graph.getEdges()];

  const containsAll = (source: Set<string>, target: readonly string[]): boolean => {
    return target.every((node) => source.has(node));
  };

  for (const edge of edges) {
    if (!graph.isAdjacentTo(edge.node1, edge.node2)) {
      continue;
    }

    let removed = false;

    for (const [source, target] of [
      [edge.node1, edge.node2],
      [edge.node2, edge.node1]
    ] as const) {
      const possibleDsep = getPossibleDsep(graph, source, target, maxPathLength);

      for (let size = possibleDsep.length; size >= 2; size -= 1) {
        for (const choice of combinations(
          possibleDsep.map((_, index) => index),
          size
        )) {
          const sepset = choice.map((index) => possibleDsep[index]!).filter(Boolean);
          if (containsAll(new Set(graph.getAdjacentNodeIds(source)), sepset)) {
            continue;
          }
          if (containsAll(new Set(graph.getAdjacentNodeIds(target)), sepset)) {
            continue;
          }

          const pValue = ciTest.test(
            graph.getNodeIndex(source),
            graph.getNodeIndex(target),
            sepset.map((node) => graph.getNodeIndex(node))
          );

          if (pValue > alpha) {
            graph.removeEdge(source, target);
            setSepset(
              sepsets,
              graph.getNodeIndex(source),
              graph.getNodeIndex(target),
              sepset.map((node) => graph.getNodeIndex(node))
            );
            removed = true;
            break;
          }
        }

        if (removed) {
          break;
        }
      }

      if (removed) {
        break;
      }
    }
  }
}

function rule0(
  graph: CausalGraph,
  sepsets: SepsetMap,
  backgroundKnowledge?: BackgroundKnowledge
): void {
  reorientAllWith(graph, EDGE_ENDPOINT.circle);
  fciOrientByBackgroundKnowledge(graph, backgroundKnowledge);

  for (const [a, b, c] of findPagUnshieldedTriples(graph)) {
    if (graph.isDefCollider(a, b, c)) {
      continue;
    }

    const sepSet = getSepset(sepsets, a, c);
    if (!sepSet || sepSet.includes(b)) {
      continue;
    }

    const nodeA = graph.getNodeIdAt(a);
    const nodeB = graph.getNodeIdAt(b);
    const nodeC = graph.getNodeIdAt(c);

    if (!canOrientArrowhead(nodeA, nodeB, graph, backgroundKnowledge)) {
      continue;
    }
    if (!canOrientArrowhead(nodeC, nodeB, graph, backgroundKnowledge)) {
      continue;
    }

    orientEdge(graph, nodeA, nodeB, graph.getEndpoint(nodeA, nodeB), EDGE_ENDPOINT.arrow);
    orientEdge(graph, nodeC, nodeB, graph.getEndpoint(nodeC, nodeB), EDGE_ENDPOINT.arrow);
  }
}

function isNoncollider(graph: CausalGraph, sepsets: SepsetMap, i: string, j: string, k: string): boolean {
  const sepSet = getSepset(sepsets, graph.getNodeIndex(i), graph.getNodeIndex(k));
  return sepSet !== undefined && sepSet.includes(graph.getNodeIndex(j));
}

function ruleR1(
  a: string,
  b: string,
  c: string,
  graph: CausalGraph,
  backgroundKnowledge?: BackgroundKnowledge
): boolean {
  if (graph.isAdjacentTo(a, c)) {
    return false;
  }

  if (endpointTowards(graph, a, b) === EDGE_ENDPOINT.arrow && endpointTowards(graph, c, b) === EDGE_ENDPOINT.circle) {
    if (!canOrientArrowhead(b, c, graph, backgroundKnowledge)) {
      return false;
    }
    return orientEdge(graph, c, b, EDGE_ENDPOINT.arrow, EDGE_ENDPOINT.tail);
  }

  return false;
}

function ruleR2(
  a: string,
  b: string,
  c: string,
  graph: CausalGraph,
  backgroundKnowledge?: BackgroundKnowledge
): boolean {
  if (graph.isAdjacentTo(a, c) && endpointTowards(graph, a, c) === EDGE_ENDPOINT.circle) {
    if (
      endpointTowards(graph, a, b) === EDGE_ENDPOINT.arrow &&
      endpointTowards(graph, b, c) === EDGE_ENDPOINT.arrow &&
      (endpointTowards(graph, b, a) === EDGE_ENDPOINT.tail ||
        endpointTowards(graph, c, b) === EDGE_ENDPOINT.tail)
    ) {
      if (!canOrientArrowhead(a, c, graph, backgroundKnowledge)) {
        return false;
      }

      return orientEdge(graph, a, c, graph.getEndpoint(a, c), EDGE_ENDPOINT.arrow);
    }
  }

  return false;
}

function rulesR1R2cycle(graph: CausalGraph, backgroundKnowledge?: BackgroundKnowledge): boolean {
  let changed = false;
  for (const nodeB of graph.getNodeIds()) {
    const adjacent = graph.getAdjacentNodeIds(nodeB);
    for (let i = 0; i < adjacent.length; i += 1) {
      for (let j = i + 1; j < adjacent.length; j += 1) {
        const nodeA = adjacent[i]!;
        const nodeC = adjacent[j]!;
        changed = ruleR1(nodeA, nodeB, nodeC, graph, backgroundKnowledge) || changed;
        changed = ruleR1(nodeC, nodeB, nodeA, graph, backgroundKnowledge) || changed;
        changed = ruleR2(nodeA, nodeB, nodeC, graph, backgroundKnowledge) || changed;
        changed = ruleR2(nodeC, nodeB, nodeA, graph, backgroundKnowledge) || changed;
      }
    }
  }
  return changed;
}

function ruleR3(
  graph: CausalGraph,
  sepsets: SepsetMap,
  backgroundKnowledge?: BackgroundKnowledge
): boolean {
  let changed = false;

  for (const nodeB of graph.getNodeIds()) {
    const intoBArrows = graph.getNodeIdsInto(nodeB, EDGE_ENDPOINT.arrow);
    const intoBCircles = graph.getNodeIdsInto(nodeB, EDGE_ENDPOINT.circle);

    for (const nodeD of intoBCircles) {
      if (intoBArrows.length < 2) {
        continue;
      }

      for (let i = 0; i < intoBArrows.length; i += 1) {
        for (let j = i + 1; j < intoBArrows.length; j += 1) {
          const nodeA = intoBArrows[i]!;
          const nodeC = intoBArrows[j]!;

          if (graph.isAdjacentTo(nodeA, nodeC)) {
            continue;
          }

          if (!graph.isAdjacentTo(nodeA, nodeD) || !graph.isAdjacentTo(nodeC, nodeD)) {
            continue;
          }

          if (!isNoncollider(graph, sepsets, nodeA, nodeD, nodeC)) {
            continue;
          }

          if (
            endpointTowards(graph, nodeA, nodeD) !== EDGE_ENDPOINT.circle ||
            endpointTowards(graph, nodeC, nodeD) !== EDGE_ENDPOINT.circle
          ) {
            continue;
          }

          if (!canOrientArrowhead(nodeD, nodeB, graph, backgroundKnowledge)) {
            continue;
          }

          changed = orientEdge(
            graph,
            nodeD,
            nodeB,
            graph.getEndpoint(nodeD, nodeB),
            EDGE_ENDPOINT.arrow
          ) || changed;
        }
      }
    }
  }

  return changed;
}

function getPath(node: string, previous: Map<string, string | undefined>): string[] {
  const path: string[] = [];
  let parent = previous.get(node);
  if (parent !== undefined) {
    path.push(parent);
  }

  while (parent !== undefined) {
    parent = previous.get(parent);
    if (parent !== undefined) {
      path.push(parent);
    }
  }

  return path;
}

function doDdpOrientation(
  nodeD: string,
  nodeA: string,
  nodeB: string,
  nodeC: string,
  previous: Map<string, string | undefined>,
  graph: CausalGraph,
  ciTest: CountedCiTest,
  alpha: number,
  sepsets: SepsetMap,
  backgroundKnowledge?: BackgroundKnowledge
): { success: boolean; changed: boolean } {
  if (graph.isAdjacentTo(nodeD, nodeC)) {
    throw new Error("Illegal definite discriminating path orientation state.");
  }

  const path = getPath(nodeD, previous);
  const condSet = path.map((node) => graph.getNodeIndex(node));
  const independent = ciTest.test(graph.getNodeIndex(nodeD), graph.getNodeIndex(nodeC), condSet) > alpha;

  const pathWithoutB = path.filter((node) => node !== nodeB).map((node) => graph.getNodeIndex(node));
  const independentWithoutB =
    ciTest.test(graph.getNodeIndex(nodeD), graph.getNodeIndex(nodeC), pathWithoutB) > alpha;

  let useSepset = independent;
  if (!independent && !independentWithoutB) {
    const sepSet = getSepset(sepsets, graph.getNodeIndex(nodeD), graph.getNodeIndex(nodeC));
    if (!sepSet) {
      return { success: false, changed: false };
    }
    useSepset = sepSet.includes(graph.getNodeIndex(nodeB));
  }

  if (useSepset) {
    return {
      success: true,
      changed: orientEdge(graph, nodeC, nodeB, graph.getEndpoint(nodeC, nodeB), EDGE_ENDPOINT.tail)
    };
  }

  if (!canOrientArrowhead(nodeA, nodeB, graph, backgroundKnowledge)) {
    return { success: false, changed: false };
  }
  if (!canOrientArrowhead(nodeC, nodeB, graph, backgroundKnowledge)) {
    return { success: false, changed: false };
  }

  const changedA = orientEdge(graph, nodeA, nodeB, graph.getEndpoint(nodeA, nodeB), EDGE_ENDPOINT.arrow);
  const changedC = orientEdge(graph, nodeC, nodeB, graph.getEndpoint(nodeC, nodeB), EDGE_ENDPOINT.arrow);
  return { success: true, changed: changedA || changedC };
}

function ddpOrient(
  nodeA: string,
  nodeB: string,
  nodeC: string,
  graph: CausalGraph,
  maxPathLength: number,
  ciTest: CountedCiTest,
  alpha: number,
  sepsets: SepsetMap,
  backgroundKnowledge?: BackgroundKnowledge
): boolean {
  const queue: string[] = [];
  const visited = new Set<string>();
  const previous = new Map<string, string | undefined>();
  const cParents = new Set(graph.getParentIds(nodeC));
  let currentLayerNode: string | undefined;
  let distance = 0;

  queue.push(nodeA);
  visited.add(nodeA);
  visited.add(nodeB);
  previous.set(nodeA, nodeB);

  while (queue.length > 0) {
    const nodeT = queue.shift();
    if (!nodeT) {
      continue;
    }

    if (currentLayerNode === undefined || currentLayerNode === nodeT) {
      currentLayerNode = nodeT;
      distance += 1;
      if (distance > 0 && distance > (maxPathLength === -1 ? 1000 : maxPathLength)) {
        return false;
      }
    }

    const nodesIntoT = graph.getNodeIdsInto(nodeT, EDGE_ENDPOINT.arrow);

    for (const nodeD of nodesIntoT) {
      if (visited.has(nodeD)) {
        continue;
      }

      previous.set(nodeD, nodeT);
      const nodeP = previous.get(nodeT);
      if (!nodeP || !graph.isDefColliderByIds(nodeD, nodeT, nodeP)) {
        continue;
      }

      if (!graph.isAdjacentTo(nodeD, nodeC) && nodeD !== nodeC) {
        const result = doDdpOrientation(
          nodeD,
          nodeA,
          nodeB,
          nodeC,
          previous,
          graph,
          ciTest,
          alpha,
          sepsets,
          backgroundKnowledge
        );

        if (result.success) {
          return result.changed;
        }
      }

      if (cParents.has(nodeD)) {
        queue.push(nodeD);
        visited.add(nodeD);
      }
    }
  }

  return false;
}

function ruleR4B(
  graph: CausalGraph,
  maxPathLength: number,
  ciTest: CountedCiTest,
  alpha: number,
  sepsets: SepsetMap,
  backgroundKnowledge?: BackgroundKnowledge
): boolean {
  let changed = false;

  for (const nodeB of graph.getNodeIds()) {
    const possA = graph.getNodeIdsOutOf(nodeB, EDGE_ENDPOINT.arrow);
    const possC = graph.getNodeIdsInto(nodeB, EDGE_ENDPOINT.circle);

    for (const nodeA of possA) {
      for (const nodeC of possC) {
        if (!graph.isParentOf(nodeA, nodeC)) {
          continue;
        }
        if (endpointTowards(graph, nodeB, nodeC) !== EDGE_ENDPOINT.arrow) {
          continue;
        }

        changed = ddpOrient(
          nodeA,
          nodeB,
          nodeC,
          graph,
          maxPathLength,
          ciTest,
          alpha,
          sepsets,
          backgroundKnowledge
        ) || changed;
      }
    }
  }

  return changed;
}

export function applyFciRuleR5(graph: CausalGraph): boolean {
  let changed = false;

  const orientOnPath = (path: readonly string[], nodeA: string, nodeB: string): void => {
    changed = orientEdge(graph, nodeA, path[0]!, EDGE_ENDPOINT.tail, EDGE_ENDPOINT.tail) || changed;
    changed =
      orientEdge(graph, nodeB, path[path.length - 1]!, EDGE_ENDPOINT.tail, EDGE_ENDPOINT.tail) || changed;

    for (let index = 0; index < path.length - 1; index += 1) {
      const left = path[index]!;
      const right = path[index + 1]!;
      changed = orientEdge(graph, left, right, EDGE_ENDPOINT.tail, EDGE_ENDPOINT.tail) || changed;
    }
  };

  for (const nodeB of graph.getNodeIds()) {
    const intoBCircles = graph.getNodeIdsInto(nodeB, EDGE_ENDPOINT.circle);

    for (const nodeA of intoBCircles) {
      if (endpointTowards(graph, nodeB, nodeA) !== EDGE_ENDPOINT.circle) {
        continue;
      }

      const foundPaths: string[][] = [];
      const aCircleAdjNodes = graph
        .getAdjacentNodeIds(nodeA)
        .filter((node) => node !== nodeA && node !== nodeB && graph.isCircleEdge(node, nodeA));
      const bCircleAdjNodes = graph
        .getAdjacentNodeIds(nodeB)
        .filter((node) => node !== nodeA && node !== nodeB && graph.isCircleEdge(node, nodeB));

      for (const nodeC of aCircleAdjNodes) {
        if (graph.isAdjacentTo(nodeB, nodeC)) {
          continue;
        }

        for (const nodeD of bCircleAdjNodes) {
          if (graph.isAdjacentTo(nodeA, nodeD)) {
            continue;
          }

          foundPaths.push(...getUncoveredCirclePaths(graph, nodeC, nodeD, [nodeA, nodeB]));
        }
      }

      for (const path of foundPaths) {
        changed = orientEdge(graph, nodeA, nodeB, EDGE_ENDPOINT.tail, EDGE_ENDPOINT.tail) || changed;
        orientOnPath(path, nodeA, nodeB);
      }
    }
  }

  return changed;
}

function ruleR6(graph: CausalGraph): boolean {
  let changed = false;

  for (const nodeB of graph.getNodeIds()) {
    const intoBTails = graph.getNodeIdsInto(nodeB, EDGE_ENDPOINT.tail);
    const hasUndirected = intoBTails.some((nodeA) => endpointTowards(graph, nodeB, nodeA) === EDGE_ENDPOINT.tail);
    if (!hasUndirected) {
      continue;
    }

    for (const nodeC of graph.getNodeIdsInto(nodeB, EDGE_ENDPOINT.circle)) {
      changed =
        orientEdge(graph, nodeB, nodeC, EDGE_ENDPOINT.tail, graph.getEndpoint(nodeC, nodeB)) || changed;
    }
  }

  return changed;
}

function ruleR7(graph: CausalGraph): boolean {
  let changed = false;

  for (const nodeB of graph.getNodeIds()) {
    const intoBCircles = graph.getNodeIdsInto(nodeB, EDGE_ENDPOINT.circle);
    const nodeAList = intoBCircles.filter((nodeA) => endpointTowards(graph, nodeB, nodeA) === EDGE_ENDPOINT.tail);

    for (const nodeC of intoBCircles) {
      for (const nodeA of nodeAList) {
        if (nodeA === nodeC || graph.isAdjacentTo(nodeA, nodeC)) {
          continue;
        }
        changed =
          orientEdge(graph, nodeB, nodeC, EDGE_ENDPOINT.tail, graph.getEndpoint(nodeC, nodeB)) || changed;
      }
    }
  }

  return changed;
}

function isPossibleParent(graph: CausalGraph, potentialParentNode: string, childNode: string): boolean {
  if (potentialParentNode === childNode || !graph.isAdjacentTo(potentialParentNode, childNode)) {
    return false;
  }

  return endpointTowards(graph, childNode, potentialParentNode) !== EDGE_ENDPOINT.arrow;
}

function findPossibleChildren(
  graph: CausalGraph,
  parentNode: string,
  candidateNodes?: readonly string[]
): Set<string> {
  const nodes = candidateNodes ?? graph.getNodeIds().filter((node) => node !== parentNode);
  const possibleChildren = new Set<string>();

  for (const node of nodes) {
    if (isPossibleParent(graph, parentNode, node)) {
      possibleChildren.add(node);
    }
  }

  return possibleChildren;
}

function rule8(graph: CausalGraph): boolean {
  let changed = false;

  for (const nodeB of graph.getNodeIds()) {
    const adjacent = graph.getAdjacentNodeIds(nodeB);
    for (let i = 0; i < adjacent.length; i += 1) {
      for (let j = i + 1; j < adjacent.length; j += 1) {
        const nodeA = adjacent[i]!;
        const nodeC = adjacent[j]!;

        const firstPattern =
          endpointTowards(graph, nodeA, nodeB) === EDGE_ENDPOINT.arrow &&
          endpointTowards(graph, nodeB, nodeA) === EDGE_ENDPOINT.tail &&
          endpointTowards(graph, nodeB, nodeC) === EDGE_ENDPOINT.arrow &&
          endpointTowards(graph, nodeC, nodeB) === EDGE_ENDPOINT.tail &&
          graph.isAdjacentTo(nodeA, nodeC) &&
          endpointTowards(graph, nodeA, nodeC) === EDGE_ENDPOINT.arrow &&
          endpointTowards(graph, nodeC, nodeA) === EDGE_ENDPOINT.circle;

        const secondPattern =
          endpointTowards(graph, nodeA, nodeB) === EDGE_ENDPOINT.circle &&
          endpointTowards(graph, nodeB, nodeA) === EDGE_ENDPOINT.tail &&
          endpointTowards(graph, nodeB, nodeC) === EDGE_ENDPOINT.arrow &&
          endpointTowards(graph, nodeC, nodeB) === EDGE_ENDPOINT.tail &&
          graph.isAdjacentTo(nodeA, nodeC) &&
          endpointTowards(graph, nodeA, nodeC) === EDGE_ENDPOINT.arrow &&
          endpointTowards(graph, nodeC, nodeA) === EDGE_ENDPOINT.circle;

        if (firstPattern || secondPattern) {
          changed = orientEdge(graph, nodeA, nodeC, EDGE_ENDPOINT.tail, EDGE_ENDPOINT.arrow) || changed;
        }
      }
    }
  }

  return changed;
}

function rule9(graph: CausalGraph): boolean {
  let changed = false;

  for (const nodeC of graph.getNodeIds()) {
    const intoCArrows = graph.getNodeIdsInto(nodeC, EDGE_ENDPOINT.arrow);
    for (const nodeA of intoCArrows) {
      if (endpointTowards(graph, nodeC, nodeA) !== EDGE_ENDPOINT.circle) {
        continue;
      }

      const aAdjNodes = graph.getAdjacentNodeIds(nodeA).filter((node) => node !== nodeC);
      const possibleChildren = findPossibleChildren(graph, nodeA, aAdjNodes);

      for (const nodeB of possibleChildren) {
        if (graph.isAdjacentTo(nodeB, nodeC)) {
          continue;
        }

        if (existsUncoveredPdPath(graph, nodeA, nodeB, nodeC)) {
          changed = orientEdge(graph, nodeA, nodeC, EDGE_ENDPOINT.tail, EDGE_ENDPOINT.arrow) || changed;
          break;
        }
      }
    }
  }

  return changed;
}

function rule10(graph: CausalGraph): boolean {
  let changed = false;

  for (const nodeC of graph.getNodeIds()) {
    const intoCArrows = graph.getNodeIdsInto(nodeC, EDGE_ENDPOINT.arrow);
    if (intoCArrows.length < 2) {
      continue;
    }

    const aNodes = intoCArrows.filter((nodeA) => endpointTowards(graph, nodeC, nodeA) === EDGE_ENDPOINT.circle);
    if (aNodes.length === 0) {
      continue;
    }

    for (const nodeA of aNodes) {
      const aPossibleChildren = [...findPossibleChildren(graph, nodeA, graph.getAdjacentNodeIds(nodeA).filter((node) => node !== nodeC))];
      if (aPossibleChildren.length < 2) {
        continue;
      }

      for (let i = 0; i < intoCArrows.length; i += 1) {
        for (let j = i + 1; j < intoCArrows.length; j += 1) {
          const nodeB = intoCArrows[i]!;
          const nodeD = intoCArrows[j]!;

          if (
            endpointTowards(graph, nodeC, nodeB) !== EDGE_ENDPOINT.tail ||
            endpointTowards(graph, nodeC, nodeD) !== EDGE_ENDPOINT.tail
          ) {
            continue;
          }

          for (let first = 0; first < aPossibleChildren.length; first += 1) {
            for (let second = first + 1; second < aPossibleChildren.length; second += 1) {
              const childOne = aPossibleChildren[first]!;
              const childTwo = aPossibleChildren[second]!;

              if (
                existsSemiDirectedPath(graph, childOne, nodeB) &&
                existsSemiDirectedPath(graph, childTwo, nodeD) &&
                !graph.isAdjacentTo(childOne, childTwo)
              ) {
                changed =
                  orientEdge(graph, nodeA, nodeC, EDGE_ENDPOINT.tail, EDGE_ENDPOINT.arrow) || changed;
              }
            }
          }
        }
      }
    }
  }

  return changed;
}

function createCountedCiTest(options: FciOptions): { ciTest: CountedCiTest; getCount: () => number } {
  let count = 0;
  return {
    ciTest: {
      test(x, y, conditioningSet) {
        count += 1;
        return options.ciTest.test(x, y, conditioningSet);
      }
    },
    getCount: () => count
  };
}

function shouldRunInitialR4B(backgroundKnowledge?: BackgroundKnowledge): boolean {
  if (!backgroundKnowledge) {
    return false;
  }

  const shape = backgroundKnowledge.toShape();
  const hasForbiddenRules = shape.forbidden.length > 0 || shape.forbiddenPatterns.length > 0;
  const hasRequiredRules = shape.required.length > 0 || shape.requiredPatterns.length > 0;
  const hasTierConstraints = shape.tiers.length > 0;

  return hasForbiddenRules && hasRequiredRules && hasTierConstraints;
}

export function xLearner(options: XLearnerOptions): FciResult {
  const alpha = options.alpha ?? 0.05;
  const maxPathLength = options.maxPathLength ?? -1;
  const nodeLabels = createNodeLabels(options.data.columns, options.nodeLabels);
  const { ciTest, getCount } = createCountedCiTest(options);
  const { backgroundKnowledge, skeletonKnowledge } = buildFunctionalDependencyEnhancement(options, nodeLabels, ciTest);
  const { graph, sepsets, maxDepth } = skeletonDiscovery(
    {
      ...options,
      nodeLabels,
      backgroundKnowledge
    },
    ciTest
  );

  for (const key of skeletonKnowledge) {
    const [left, right] = parsePairKey(key);
    const nodeLeft = nodeLabels[left];
    const nodeRight = nodeLabels[right];
    if (!nodeLeft || !nodeRight || graph.isAdjacentTo(nodeLeft, nodeRight)) {
      continue;
    }
    graph.addUndirectedEdge(nodeLeft, nodeRight);
  }

  reorientAllWith(graph, EDGE_ENDPOINT.circle);
  rule0(graph, sepsets, backgroundKnowledge);
  removeByPossibleDsep(graph, ciTest, alpha, sepsets, maxPathLength);
  reorientAllWith(graph, EDGE_ENDPOINT.circle);
  rule0(graph, sepsets, backgroundKnowledge);

  let changed = true;
  let firstTime = true;

  while (changed) {
    changed = false;
    changed = rulesR1R2cycle(graph, backgroundKnowledge) || changed;
    changed = ruleR3(graph, sepsets, backgroundKnowledge) || changed;

    const shouldRunR4B = changed || (firstTime && shouldRunInitialR4B(backgroundKnowledge));

    if (shouldRunR4B) {
      changed = ruleR4B(graph, maxPathLength, ciTest, alpha, sepsets, backgroundKnowledge) || changed;
      firstTime = false;
    }

    changed = applyFciRuleR5(graph) || changed;
    changed = ruleR6(graph) || changed;
    changed = ruleR7(graph) || changed;
    changed = rule8(graph) || changed;
    changed = rule9(graph) || changed;
    changed = rule10(graph) || changed;
  }

  return {
    graph: graph.toShape(),
    maxDepth,
    sepsets: serializeSepsets(sepsets),
    testsRun: getCount()
  };
}
