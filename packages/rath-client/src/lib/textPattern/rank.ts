// Copyright (C) 2023 observedobserver
// 
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
// 
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import { IPatternNode, ITextPattern } from "./interfaces";

export function textPatternScoreCompare (patternA: ITextPattern, patternB: ITextPattern) {
    return patternB.score - patternA.score
}

/**
 * structural score first — it encodes the interaction semantics (knowledge vs literal,
 * broaden vs narrow) and must not be overridden by data evidence.
 * Among structural ties, prefer the pattern that matches FEWER cells: candidates tie when
 * they share the same selection pattern and differ only in context, and the tighter
 * context is the safer extraction (over-matching corrupts data silently, under-matching
 * shows up as visibly empty cells and can be fixed by selecting one more example).
 */
export function textPatternScoreCompareWithStats (patternA: ITextPattern, patternB: ITextPattern) {
    if (patternB.score !== patternA.score) {
        return patternB.score - patternA.score;
    }
    if (patternA.stats && patternB.stats && patternA.stats.matched !== patternB.stats.matched) {
        return patternA.stats.matched - patternB.stats.matched;
    }
    return 0;
}

export function patternNodeCompare (nodeA: IPatternNode, nodeB: IPatternNode) {
    return nodeB.depth / nodeB.specLabel - nodeA.depth / nodeA.specLabel
}

/**
 * the score of a pattern node is the ratio of its depth to its specificity label
 * the larger the score, the more specific the node is
 * @param node 
 * @returns 
 */
export function getPatternNodeScore (node: IPatternNode) {
    return node.depth / node.specLabel
}