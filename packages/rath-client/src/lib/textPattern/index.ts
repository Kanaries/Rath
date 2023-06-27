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
if (window.Buffer === undefined) window.Buffer = Buffer;
import regexgen from 'regexgen';
import type { IPatternNode, ITextPattern, ITextSelection } from './interfaces';
import { getPatternNodeScore, patternNodeCompare } from './rank';

export type { IPatternNode, ITextPattern, ITextSelection };

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
                                name: 'date',
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
                        pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}/,
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
function addPattern2PatternTree(exactPattern: string, tree: IPatternNode) {
    const nodePattern = new RegExp(`^${tree.pattern.source}$`);
    if (nodePattern.test(exactPattern)) {
        if (tree.type === 'specific') {
            return;
        }
        if (tree.type === 'generalize') {
            for (let child of tree.children) {
                const childPattern = new RegExp(`^${child.pattern.source}$`);
                if (childPattern.test(exactPattern)) {
                    return;
                }
            }
            tree.children.push({
                name: exactPattern,
                pattern: createSafeRegExp(exactPattern),
                type: 'specific',
                children: [],
            });
            tree.pattern = regexgen(tree.children.map((c) => c.pattern.source));
            tree.name = tree.pattern.source;
            return;
        }
        // discuss: create new generalize node
        for (let child of tree.children) {
            const childPattern = new RegExp(`^${child.pattern.source}$`);
            if (childPattern.test(exactPattern)) {
                addPattern2PatternTree(exactPattern, child);
                return;
            }
        }
        const generalizeChild = tree.children.find((c) => c.type === 'generalize');
        if (generalizeChild) {
            generalizeChild.pattern = regexgen(generalizeChild.children.map((c) => c.pattern.source).concat(exactPattern));
            generalizeChild.name = generalizeChild.pattern.source;
            generalizeChild.children.push({
                name: exactPattern,
                pattern: createSafeRegExp(exactPattern),
                type: 'specific',
                children: [],
            });
        } else {
            tree.children.push({
                name: exactPattern,
                pattern: createSafeRegExp(exactPattern),
                type: 'generalize',
                children: [
                    {
                        name: exactPattern,
                        pattern: createSafeRegExp(exactPattern),
                        type: 'specific',
                        children: [],
                    },
                ],
            });
        }
    }
    return tree;
}

function LCALabeling(tree: IPatternNode, depth: number): number {
    if (tree.type === 'specific') {
        tree.specLabel = 1;
        tree.depth = depth;
        return 1;
    }
    let specLabel = 0;
    for (let child of tree.children) {
        specLabel += LCALabeling(child, depth + 1);
    }
    tree.specLabel = specLabel;
    tree.depth = depth;
    return specLabel;
}

function collectingCANodes(tree: IPatternNode, label: number, nodes: IPatternNode[]) {
    if (tree.specLabel === label) {
        nodes.push(tree);
    } else {
        return;
    }
    for (let child of tree.children) {
        collectingCANodes(child, label, nodes);
    }
}

function findCommonParentsOfSepcificNodesInPatternTree(tree: IPatternNode): IPatternNode[] {
    const parents: IPatternNode[] = [];
    LCALabeling(tree, 0);
    collectingCANodes(tree, tree.specLabel, parents);
    return parents;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getRepeatNodes(nodes1: IPatternNode[], nodes2: IPatternNode[]): IPatternNode[] {
    const repeatNodes: IPatternNode[] = [];
    for (let node1 of nodes1) {
        for (let node2 of nodes2) {
            if (node1.name === node2.name) {
                repeatNodes.push(node1);
            }
        }
    }
    return repeatNodes;
}

function copyNode(node: IPatternNode): IPatternNode {
    let nextNode: IPatternNode = {
        name: node.name,
        pattern: node.pattern,
        type: node.type,
        children: [],
        specLabel: node.specLabel,
        depth: node.depth,
    };
    for (let child of node.children) {
        nextNode.children.push(copyNode(child));
    }
    return nextNode;
}

export function intersectPattern(textSelection: ITextSelection[]): ITextPattern[] {
    const patternTree = initPatternTree();
    // const patternTypes = new Set<string>();
    const rawPH: string[] = [];
    const rawPE: string[] = [];
    let uniques: IPatternNode[] = [];
    for (let text of textSelection) {
        const selection = text.str.slice(text.startIndex, text.endIndex);
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
        addPattern2PatternTree(selection, patternTree);
        const commonParents = findCommonParentsOfSepcificNodesInPatternTree(patternTree).map((n) => copyNode(n));
        uniques = commonParents
    }
    // const commonParents = findCommonParentsOfSepcificNodesInPatternTree(patternTree);
    uniques.sort(patternNodeCompare);
    if (textSelection.length === 1) {
        uniques = uniques.filter(u => u.type === 'knowledge').concat(uniques.filter(u => u.type !== 'knowledge'))
    }
    // console.log('commonParents', uniques, patternTree, textSelection);
    // console.log(rawPE, rawPH)
    // const ph = rawPH.length > 0 ? regexgen(rawPH) : new RegExp('^');
    // const pe = rawPE.length > 0 ? regexgen(rawPE) : new RegExp('$');
    let phs: RegExp[] = [new RegExp('^')];
    let pes: RegExp[] = [new RegExp('$')];
    if (rawPH.length > 0) {
        phs = textPatternInduction(rawPH).map(p => p.pattern)
    }
    if (rawPE.length > 0) {
        pes = textPatternInduction(rawPE).map(p => p.pattern)
    }
    const ans: ITextPattern[] = [];

    for (let uni of uniques) {
        for (let ph of phs) {
            for (let pe of pes) {
                const patt: ITextPattern = {
                    ph,
                    pe,
                    selection: uni.pattern,
                    pattern: new RegExp(`${ph.source}(?<selection>${uni.pattern.source})${pe.source}`),
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
    // uniques.length === 0 wihch is impossible
    if (ans.length === 0) {
        const sl = regexgen(textSelection.map(t => t.str.slice(t.startIndex, t.endIndex)))
        for (let ph of phs) {
            for (let pe of pes) {
                
                const patt: ITextPattern = {
                    ph,
                    pe,
                    selection: sl,
                    pattern: new RegExp(`${ph.source}(?<selection>${sl.source})${pe.source}`),
                    selectionType: 'generalize',
                    score: 1
                };
                const match = textSelection.every(text => {
                    const res = extractSelection(patt ,text.str)
                    if (res.missing) return false;
                    return res.matchPos[0] === text.startIndex && res.matchPos[1] === text.endIndex;
                });
                if (match) {
                    ans.push(patt);
                }
            }
        }
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

export function textPatternInduction(textList: string[]) {
    const patternTree = initPatternTree();
    let uniques: IPatternNode[] = [];
    for (let text of textList) {
        addPattern2PatternTree(text, patternTree);
        const commonParents = findCommonParentsOfSepcificNodesInPatternTree(patternTree).map((n) => copyNode(n));
        // if (uniques.length === 0) {
        //     uniques = commonParents;
        // } else {
        //     uniques = getRepeatNodes(uniques, commonParents);
        // }
        uniques = commonParents;
    }
    const ph = /^/;
    const pe =  /$/;
    uniques = uniques.filter(uni => {

        const patt: ITextPattern = {
            ph,
            pe,
            selection: uni.pattern,
            pattern: new RegExp(`${ph.source}(?<selection>${uni.pattern.source})${pe.source}`),
            selectionType: uni.type,
            score: getPatternNodeScore(uni)
        }
        return textList.every(text => {
            const res = extractSelection(patt ,text)
            if (res.missing) return false;
            return res.matchPos[0] === 0 && res.matchPos[1] === text.length;
        })
    })
    uniques.sort(patternNodeCompare);
    return uniques
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
export function extractSelection(selectionPattern: ITextPattern, text: string): IExtractResult {
    if (text.length === 0) return { missing: true };
    const { pattern } = selectionPattern;
    const patternForIndices = new RegExp(pattern.source, pattern.flags + 'd');
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
