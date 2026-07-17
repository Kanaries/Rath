import { IFieldMeta } from '../../interfaces';

/**
 * 渐进式 dashboard 推荐引擎（predictive interaction）。
 * 输入是预先算好的字段关系矩阵（worker 中基于 MIC 计算），主线程上只做矩阵上的贪心搜索，
 * 因此每次交互（锁定/换一批/改字段）都可以同步重算，不会卡 UI。
 */

export type IDashField = IFieldMeta | '*';

export interface IDashView {
    id: string;
    /** 已固定：不再参与自动补全，字段即最终字段 */
    locked: boolean;
    /** “换一批”计数：跳过前 n 个最优候选，让用户翻页式浏览备选方案 */
    shuffleOffset: number;
    fields: IDashField[];
    /** 固定前的字段配置，解除固定时恢复，让占位符重新参与推荐 */
    prevFields?: IDashField[];
}

export interface IFieldReason {
    /** 因为与哪个字段的关系被推荐进来 */
    anchorFid: string;
    /** 两字段间的关联强度（有向矩阵中较大的一侧） */
    score: number;
}

export interface IViewRecommendation {
    viewId: string;
    /** 补全后的字段（用户指定的在前，自动补全的在后） */
    fields: IFieldMeta[];
    /** 自动补全字段的推荐理由，key 为 fid */
    reasons: Map<string, IFieldReason>;
    /** 视图内字段两两关联的平均强度，用于展示推荐质量 */
    quality: number;
    /** 没能找到合适字段的占位符数量 */
    unfilled: number;
}

const MIN_SCORE = 0.01;
/** 基数过高的维度画出来的图基本不可读，排序时降权 */
const HIGH_CARDINALITY = 30;
const HIGH_CARDINALITY_PENALTY = 0.5;
/** 视图里还没有度量时，优先补一个度量进来 */
const MEASURE_BONUS = 0.05;

function pairScore(matrix: number[][], i: number, j: number): number {
    return Math.max(matrix[i][j], matrix[j][i]);
}

/** 排序用的分数：在原始关联强度上叠加图表可读性的启发式调整 */
function rankScore(rawScore: number, candidate: IFieldMeta, groupHasMeasure: boolean): number {
    let score = rawScore;
    if (candidate.analyticType === 'dimension' && candidate.features.unique > HIGH_CARDINALITY) {
        score *= HIGH_CARDINALITY_PENALTY;
    }
    if (!groupHasMeasure && candidate.analyticType === 'measure') {
        score += MEASURE_BONUS;
    }
    return score;
}

interface IEdgeCandidate {
    /** 组内锚点字段下标 */
    from: number;
    /** 组外候选字段下标 */
    to: number;
    rawScore: number;
    rank: number;
}

/**
 * 列出从 group 出发、通往组外字段的所有未使用关系，按调整后分数降序。
 * 每个组外字段只保留与其关联最强的锚点。
 */
function listCandidateEdges(
    fields: IFieldMeta[],
    matrix: number[][],
    markMatrix: boolean[][],
    groupIndices: number[],
    excludeIndices: Set<number>,
    groupHasMeasure: boolean
): IEdgeCandidate[] {
    const bestByTarget: Map<number, IEdgeCandidate> = new Map();
    for (const from of groupIndices) {
        for (let to = 0; to < fields.length; to++) {
            if (to === from || excludeIndices.has(to)) continue;
            if (markMatrix[from][to] || markMatrix[to][from]) continue;
            const raw = pairScore(matrix, from, to);
            if (raw < MIN_SCORE) continue;
            const rank = rankScore(raw, fields[to], groupHasMeasure);
            const prev = bestByTarget.get(to);
            if (!prev || rank > prev.rank) {
                bestByTarget.set(to, { from, to, rawScore: raw, rank });
            }
        }
    }
    return [...bestByTarget.values()].sort((a, b) => b.rank - a.rank);
}

/** 冷启动：整个 dashboard 还没有任何用户指定字段时，找全局最强的未使用关系作为起点 */
function strongestGlobalEdge(
    fields: IFieldMeta[],
    matrix: number[][],
    markMatrix: boolean[][],
    skip: number
): IEdgeCandidate | null {
    const edges: IEdgeCandidate[] = [];
    for (let i = 0; i < fields.length; i++) {
        for (let j = i + 1; j < fields.length; j++) {
            if (markMatrix[i][j] || markMatrix[j][i]) continue;
            const raw = pairScore(matrix, i, j);
            if (raw < MIN_SCORE) continue;
            edges.push({ from: i, to: j, rawScore: raw, rank: rankScore(raw, fields[j], false) });
        }
    }
    if (edges.length === 0) return null;
    edges.sort((a, b) => b.rank - a.rank);
    return edges[skip % edges.length];
}

export interface IRecommendDashboardProps {
    fields: IFieldMeta[];
    /** fields 顺序对齐的关系矩阵 */
    matrix: number[][];
    views: IDashView[];
}

export function recommendDashboard(props: IRecommendDashboardProps): IViewRecommendation[] {
    const { fields, matrix, views } = props;
    const fieldIndexMap: Map<string, number> = new Map(fields.map((f, i) => [f.fid, i]));

    // 所有视图中用户已指定的字段对，视为“已经呈现过的关系”，其它视图不再重复推荐
    const markMatrix: boolean[][] = new Array(fields.length).fill(0).map(() => new Array(fields.length).fill(false));
    const specifiedIndicesOfView = (view: IDashView): number[] =>
        (view.fields.filter((f): f is IFieldMeta => f !== '*'))
            .map((f) => fieldIndexMap.get(f.fid))
            .filter((i): i is number => i !== undefined);
    for (const view of views) {
        const indices = specifiedIndicesOfView(view);
        for (const i of indices) {
            for (const j of indices) {
                if (i !== j) markMatrix[i][j] = markMatrix[j][i] = true;
            }
        }
    }

    // 全局锚点池：用户在任何视图中指定过的字段（按出现次数加权排序）
    const anchorWeight: Map<number, number> = new Map();
    for (const view of views) {
        for (const i of specifiedIndicesOfView(view)) {
            anchorWeight.set(i, (anchorWeight.get(i) || 0) + 1);
        }
    }
    const globalAnchors = [...anchorWeight.entries()].sort((a, b) => b[1] - a[1]).map((e) => e[0]);

    const ans: IViewRecommendation[] = [];
    for (const view of views) {
        const specified = specifiedIndicesOfView(view);
        let wildcardNum = view.fields.filter((f) => f === '*').length;
        const reasons: Map<string, IFieldReason> = new Map();

        const resolved: number[] = [...new Set(specified)];
        if (!view.locked && wildcardNum > 0 && fields.length > 1) {
            const inView = new Set(resolved);
            let group = [...resolved];
            let firstPick = true;

            if (group.length === 0 && wildcardNum >= 2) {
                // 视图内没有用户指定的字段：优先从全局锚点（用户在其他视图关注过的字段）出发，
                // 把锚点和它的最强搭档一起放进视图；完全冷启动时退化为全局最强关系。
                const externalAnchors = globalAnchors.filter((i) => !inView.has(i));
                let edge: IEdgeCandidate | null = null;
                if (externalAnchors.length > 0) {
                    const candidates = listCandidateEdges(fields, matrix, markMatrix, externalAnchors, inView, false);
                    if (candidates.length > 0) {
                        edge = candidates[view.shuffleOffset % candidates.length];
                    }
                }
                if (!edge) {
                    edge = strongestGlobalEdge(fields, matrix, markMatrix, view.shuffleOffset);
                }
                if (edge) {
                    resolved.push(edge.from, edge.to);
                    inView.add(edge.from);
                    inView.add(edge.to);
                    reasons.set(fields[edge.to].fid, { anchorFid: fields[edge.from].fid, score: edge.rawScore });
                    reasons.set(fields[edge.from].fid, { anchorFid: fields[edge.to].fid, score: edge.rawScore });
                    markMatrix[edge.from][edge.to] = markMatrix[edge.to][edge.from] = true;
                    group = [edge.from, edge.to];
                    wildcardNum -= 2;
                    firstPick = false;
                }
            }

            while (wildcardNum > 0 && group.length > 0) {
                const groupHasMeasure = resolved.some((i) => fields[i].analyticType === 'measure');
                const candidates = listCandidateEdges(fields, matrix, markMatrix, group, inView, groupHasMeasure);
                if (candidates.length === 0) break;
                // “换一批”只作用于视图的第一次补全：换一个起点，后续贪心链路随之整体变化
                const pickIndex = firstPick ? view.shuffleOffset % candidates.length : 0;
                firstPick = false;
                const edge = candidates[pickIndex];
                resolved.push(edge.to);
                inView.add(edge.to);
                if (!group.includes(edge.to)) group.push(edge.to);
                reasons.set(fields[edge.to].fid, { anchorFid: fields[edge.from].fid, score: edge.rawScore });
                markMatrix[edge.from][edge.to] = markMatrix[edge.to][edge.from] = true;
                wildcardNum--;
            }
        }

        const resolvedFields = resolved.map((i) => fields[i]);
        let quality = 0;
        if (resolved.length >= 2) {
            let total = 0;
            let count = 0;
            for (let a = 0; a < resolved.length; a++) {
                for (let b = a + 1; b < resolved.length; b++) {
                    total += pairScore(matrix, resolved[a], resolved[b]);
                    count++;
                }
            }
            quality = count > 0 ? total / count : 0;
        }

        ans.push({
            viewId: view.id,
            fields: resolvedFields,
            reasons,
            quality,
            unfilled: view.locked ? 0 : wildcardNum,
        });
    }
    return ans;
}

let viewIdCounter = 0;
export function nextViewId(): string {
    viewIdCounter += 1;
    return `dash-view-${viewIdCounter}`;
}

export function createWildcardView(slots = 2): IDashView {
    return {
        id: nextViewId(),
        locked: false,
        shuffleOffset: 0,
        fields: new Array(slots).fill('*'),
    };
}

/** 初始画布：一张以种子字段为锚点的图 + 若干待补全的空白图 */
export function createInitialViews(seedField: IFieldMeta | undefined, blankViews = 5): IDashView[] {
    const views: IDashView[] = [];
    if (seedField) {
        views.push({
            id: nextViewId(),
            locked: false,
            shuffleOffset: 0,
            fields: [seedField, '*'],
        });
    }
    for (let i = 0; i < blankViews; i++) {
        views.push(createWildcardView());
    }
    return views;
}
