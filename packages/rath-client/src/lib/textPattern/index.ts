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


/* eslint-disable import/first */
// import 'buffer/'
import { Buffer } from 'buffer';
// @ts-ignore
if (typeof window === 'object' && window.Buffer === undefined) window.Buffer = Buffer;
import regexgen from 'regexgen';
import type { IPatternNode, ITextPattern, ITextSelection } from './interfaces';
import { getPatternNodeScore, patternNodeCompare } from './rank';

export type { IPatternNode, ITextPattern, ITextSelection };

/**
 * The static knowledge base: a hierarchy of semantic pattern classes.
 * Depth encodes specificity — deeper nodes are more specific abstractions
 * and are preferred by the ranking (see rank.ts).
 * The tree is never mutated; candidates are induced by evaluating every
 * node against the user selections (see induceCandidateNodes).
 */
function initPatternTree(): IPatternNode {
    const root: IPatternNode = {
        pattern: /.+/,
        name: 'root',
        type: 'knowledge',
        children: [
            {
                name: 'pureStr',
                pattern: /\S+/,
                type: 'knowledge',
                children: [
                    {
                        name: 'text',
                        pattern: /(?!\d+)(\w+|[\u4e00-\u9fa5]+)(\s+|[\u4e00-\u9fa5]+)*/,
                        type: 'knowledge',
                        children: [
                            {
                                name: 'word',
                                pattern: /(?!\d+)(\w+)(\s+|[\u4e00-\u9fa5]+)*/,
                                type: 'knowledge',
                                children: [],
                            },
                            {
                                name: 'chinese',
                                pattern: /([\u4e00-\u9fa5]+)(?:\s+|[\u4e00-\u9fa5]+)*/,
                                type: 'knowledge',
                                children: [],
                            },
                            {
                                name: 'isoDate',
                                pattern: /(\d{4}-\d{2}-\d{2})/,
                                type: 'knowledge',
                                children: [],
                            },
                        ],
                    },
                    {
                        name: 'number',
                        pattern: /(\d+)(\.\d+)?/,
                        type: 'knowledge',
                        children: [
                            {
                                name: 'integer',
                                pattern: /\d+/,
                                type: 'knowledge',
                                children: [],
                            },
                            {
                                name: 'float',
                                pattern: /\d+\.\d+/,
                                type: 'knowledge',
                                children: [],
                            },
                        ],
                    },
                    {
                        name: 'punctuation',
                        type: 'knowledge',
                        pattern: /[\u0020-\u002F\u003A-\u0040\u005B-\u0060\u007B-\u007E\u00A0-\u00BF\u2000-\u206F\u3000-\u303F\uFF00-\uFFEF]+/,
                        children: [],
                    },
                    {
                        name: 'symbol',
                        type: 'knowledge',
                        pattern: /[\u0021-\u002F\u003A-\u0040\u005B-\u0060\u007B-\u007E\u00A0-\u00BF\u2000-\u206F\u3000-\u303F\uFF00-\uFFEF]+/,
                        children: [],
                    },
                    {
                        name: 'email',
                        type: 'knowledge',
                        pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
                        children: [],
                    },
                    {
                        name: 'phone',
                        type: 'knowledge',
                        pattern: /\(?[0-9]{3}\)?[-. ]?[0-9]{3}[-. ]?[0-9]{4}/,
                        children: [],
                    },
                    {
                        name: 'date',
                        type: 'knowledge',
                        pattern: /(0?[1-9]|[12][0-9]|3[01])[/-](0?[1-9]|1[012])[/-]\d{4}/,
                        children: [],
                    },
                    {
                        name: 'formatNumber',
                        type: 'knowledge',
                        pattern: /[+-]?(?:\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)/,
                        children: [],
                    }
                ],
            },
            {
                name: 'strWithSpaces',
                pattern: /\S+([^\S]+)?\S+([^\S]+)?\S+/,
                type: 'knowledge',
                children: [
                    {
                        name: 'strWithSpaces',
                        pattern: /\S+([^\S]+)?\S+/,
                        type: 'knowledge',
                        children: [],
                    },
                    {
                        name: 'spaces',
                        pattern: /([^\S]+)/,
                        type: 'knowledge',
                        children: [],
                    },
                    {
                        name: 'existedStrWithSpaces',
                        pattern: /\S+([^\S]+)\S+/,
                        type: 'knowledge',
                        children: [],
                    },
                ],
            },
        ],
    };
    return root;
}


function createSafeRegExp(str: string): RegExp {
    return new RegExp(str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
}
/**
 * regexgen may emit a top-level alternation (e.g. /bar|foo/); anchoring or concatenating
 * its source without a group would bind `^`/`$` to a single branch, so always wrap.
 */
function anchoredFullMatch(pattern: RegExp): RegExp {
    return new RegExp(`^(?:${pattern.source})$`);
}
function composePattern(ph: RegExp, selection: RegExp, pe: RegExp): RegExp {
    return new RegExp(`(?:${ph.source})(?<selection>${selection.source})(?:${pe.source})`);
}

interface IKnowledgeEntry {
    node: IPatternNode;
    depth: number;
    anchored: RegExp;
}
let knowledgeEntriesCache: IKnowledgeEntry[] | null = null;
/** flatten the static knowledge tree once (pre-order), pre-compiling anchored matchers */
function getKnowledgeEntries(): IKnowledgeEntry[] {
    if (knowledgeEntriesCache === null) {
        const entries: IKnowledgeEntry[] = [];
        const walk = (node: IPatternNode, depth: number) => {
            entries.push({ node, depth, anchored: anchoredFullMatch(node.pattern) });
            for (let child of node.children) {
                walk(child, depth + 1);
            }
        };
        walk(initPatternTree(), 0);
        knowledgeEntriesCache = entries;
    }
    return knowledgeEntriesCache;
}

/**
 * Induce candidate patterns for a set of selected strings.
 *
 * Every knowledge node that full-matches ALL selections is a candidate — each node is
 * evaluated independently, so a string can be abstracted along several branches at once
 * (e.g. "2021-07-08" is both a pureStr and an isoDate). On top of the knowledge
 * candidates two data-driven candidates are added:
 *  - a `generalize` node: the minimal literal union of the selections (regexgen),
 *    one level deeper than the deepest matching knowledge node;
 *  - a `specific` node when there is a single distinct selection: the escaped literal.
 *
 * Scoring stays depth/specLabel (see rank.ts): deeper — more specific — wins.
 */
function induceCandidateNodes(uniqueSelections: string[]): IPatternNode[] {
    const specCount = uniqueSelections.length;
    if (specCount === 0) {
        return [];
    }
    const candidates: IPatternNode[] = [];
    let deepestMatch = 0;
    for (const { node, depth, anchored } of getKnowledgeEntries()) {
        if (uniqueSelections.every((s) => anchored.test(s))) {
            candidates.push({
                name: node.name,
                pattern: node.pattern,
                type: 'knowledge',
                children: [],
                depth,
                specLabel: specCount,
            });
            if (depth > deepestMatch) {
                deepestMatch = depth;
            }
        }
    }
    const union = regexgen(uniqueSelections);
    candidates.push({
        name: union.source,
        pattern: union,
        type: 'generalize',
        children: [],
        depth: deepestMatch + 1,
        specLabel: specCount,
    });
    if (specCount === 1) {
        candidates.push({
            name: uniqueSelections[0],
            raw: uniqueSelections[0],
            pattern: createSafeRegExp(uniqueSelections[0]),
            type: 'specific',
            children: [],
            depth: deepestMatch + 2,
            specLabel: 1,
        });
    }
    candidates.sort(patternNodeCompare);
    return candidates;
}

export function intersectPattern(textSelection: ITextSelection[]): ITextPattern[] {
    if (textSelection.length === 0) {
        return [];
    }
    const rawPH: string[] = [];
    const rawPE: string[] = [];
    for (let text of textSelection) {
        if (text.startIndex !== 0) {
            let headStart = text.startIndex - 1;
            if (/[^\w]/.test(text.str[headStart])) {
                while (headStart - 1 >= 0 && /[^\w]/.test(text.str[headStart - 1])) {
                    headStart--;
                }
            }
            rawPH.push(text.str.slice(headStart, text.startIndex));
        }
        if (text.endIndex !== text.str.length) {
            let tailEnd = text.endIndex + 1;
            if (/[^\w]/.test(text.str[tailEnd])) {
                while (tailEnd + 1 < text.str.length && /[^\w]/.test(text.str[tailEnd + 1])) {
                    tailEnd++;
                }
            }
            rawPE.push(text.str.slice(text.endIndex, tailEnd));
        }
    }
    const uniqueSelections = Array.from(new Set(textSelection.map((t) => t.str.slice(t.startIndex, t.endIndex))));
    let uniques = induceCandidateNodes(uniqueSelections);
    if (textSelection.length === 1) {
        uniques = uniques.filter(u => u.type === 'knowledge').concat(uniques.filter(u => u.type !== 'knowledge'))
    }
    let phs: RegExp[] = [new RegExp('^')];
    let pes: RegExp[] = [new RegExp('$')];
    // besides the induced context patterns, always keep an empty context as a candidate:
    // when selections mix string-boundary and mid-string positions, no induced context
    // can verify on every selection, and without the empty fallback the whole candidate
    // set collapses to the weakest catch-all pattern.
    if (rawPH.length > 0) {
        phs = textPatternInduction(rawPH).map(p => p.pattern).concat([new RegExp('')])
    }
    if (rawPE.length > 0) {
        pes = textPatternInduction(rawPE).map(p => p.pattern).concat([new RegExp('')])
    }
    const ans: ITextPattern[] = [];

    for (let uni of uniques) {
        for (let ph of phs) {
            for (let pe of pes) {
                const patt: ITextPattern = {
                    ph,
                    pe,
                    selection: uni.pattern,
                    pattern: composePattern(ph, uni.pattern, pe),
                    selectionType: uni.type,
                    score: getPatternNodeScore(uni)
                }
                const match = textSelection.every(text => {
                    const res = extractSelection(patt ,text.str)
                    if (res.missing) return false;
                    return res.matchPos[0] === text.startIndex && res.matchPos[1] === text.endIndex;
                });
                if (match) {
                    ans.push(patt)
                }
            }
        }
    }
    if (ans.length === 0) {
        // the literal-union candidate has already been tried against every (ph, pe)
        // combination above, so only the unverified catch-all is left to offer
        const sl = regexgen(uniqueSelections);
        ans.push({
            ph: /.*/,
            pe: /.*/,
            selection: sl,
            pattern: new RegExp(`^.*(?<selection>${sl.source}).*$`),
            selectionType: 'generalize',
            score: 0
        })
    }
    return ans
}

export function textPatternInduction(textList: string[]): IPatternNode[] {
    return induceCandidateNodes(Array.from(new Set(textList)));
}

type IExtractResult =
    | {
          missing: false;
          matchedText: string;
          matchPos: [number, number];
      }
    | {
          missing: true;
      };

const patternWithIndicesCache: Map<string, RegExp> = new Map();
/** recompiling with the 'd' flag on every call is wasteful — extraction runs per table cell */
function compileWithIndices(pattern: RegExp): RegExp {
    const key = `${pattern.source} ${pattern.flags}`;
    let compiled = patternWithIndicesCache.get(key);
    if (compiled === undefined) {
        if (patternWithIndicesCache.size >= 512) {
            patternWithIndicesCache.clear();
        }
        compiled = new RegExp(pattern.source, pattern.flags.includes('d') ? pattern.flags : pattern.flags + 'd');
        patternWithIndicesCache.set(key, compiled);
    }
    return compiled;
}

export function extractSelection(selectionPattern: ITextPattern, text: string): IExtractResult {
    if (text.length === 0) return { missing: true };
    const patternForIndices = compileWithIndices(selectionPattern.pattern);
    patternForIndices.lastIndex = 0;
    const match = patternForIndices.exec(text);
    // @ts-ignore
    if (match && match.indices) {
        // @ts-ignore
        const matchedPos: [number, number] = match.indices.groups['selection'];
        if (!matchedPos) return { missing: true };
        const startPos = matchedPos[0];
        const endPos = matchedPos[1];
        return {
            missing: false,
            matchedText: text.slice(startPos, endPos),
            matchPos: matchedPos,
        };
    }
    return {
        missing: true,
    };
}
