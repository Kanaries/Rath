/* eslint-disable import/first */
// import 'buffer/'
import { Buffer } from 'buffer';
// @ts-ignore
if (window.Buffer === undefined) window.Buffer = Buffer;
import regexgen from 'regexgen';

const patterns = [
    {
        name: 'text',
        pattern: /(?!\d+$)(?:\w+|[\u4e00-\u9fa5]+)(?:\s+|[\u4e00-\u9fa5]+)*/,
    },
    {
        name: 'number',
        pattern: /(?:\d+)(?:\.\d+)?/,
    },
    {
        name: 'punctuation',
        pattern: /[\u0020-\u002F\u003A-\u0040\u005B-\u0060\u007B-\u007E\u00A0-\u00BF\u2000-\u206F\u3000-\u303F\uFF00-\uFFEF]+/,
    },
    {
        name: 'symbol',
        pattern: /[\u0021-\u002F\u003A-\u0040\u005B-\u0060\u007B-\u007E\u00A0-\u00BF\u2000-\u206F\u3000-\u303F\uFF00-\uFFEF]+/,
    },
];

interface IPatternNode {
    pattern: RegExp;
    name: string;
    children: IPatternNode[];
    type: 'knowledge' | 'generalize' | 'specific';
    [key: string]: any;
}
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
                        pattern: /(?!\d+$)(\w+|[\u4e00-\u9fa5]+)(\s+|[\u4e00-\u9fa5]+)*/,
                        type: 'knowledge',
                        children: [
                            {
                                name: 'word',
                                pattern: /(?!\d+$)(\w+)(\s+|[\u4e00-\u9fa5]+)*/,
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

export interface ITextSelection {
    str: string;
    startIndex: number;
    endIndex: number;
}

export interface ITextPattern {
    ph: RegExp;
    pe: RegExp;
    selection: RegExp;
    pattern: RegExp;
}

// @ts-ignore
// console.log('window buffer', window.Buffer, regexgen)
export function initPatterns(textSelection: ITextSelection[]): ITextPattern {
    // console.log(textSelection)
    const patternTypes = new Set<string>();
    const rawPH: string[] = [];
    const rawPE: string[] = [];
    for (let text of textSelection) {
        const selection = text.str.slice(text.startIndex, text.endIndex);
        if (text.startIndex !== 0) {
            rawPH.push(text.str.slice(text.startIndex - 1, text.startIndex));
        }
        if (text.endIndex !== text.str.length) {
            rawPE.push(text.str.slice(text.endIndex, text.endIndex + 1));
        }
        // rawPH.push(text.str.slice(text.endIndex))
        for (let pattern of patterns) {
            // console.log(pattern.name, selection)
            if (pattern.pattern.test(selection)) {
                patternTypes.add(pattern.name);
            }
        }
    }
    // console.log(rawPE, rawPH)
    const ph = rawPH.length > 0 ? regexgen(rawPH) : new RegExp('^');
    const pe = rawPE.length > 0 ? regexgen(rawPE) : new RegExp('$');
    // const ph = /.+/;
    // const pe = /.+/
    if (patternTypes.size === 1) {
        const pattName = [...patternTypes.values()][0];
        const pattern = patterns.find((p) => p.name === pattName)!;
        const concatPattern = new RegExp(`${ph.source}(?<selection>${pattern.pattern.source}?)${pe.source}`);
        if (pattern) {
            return {
                ph,
                pe,
                selection: pattern.pattern,
                pattern: concatPattern,
            };
        }
    } else {
        const concatPattern = new RegExp(`${ph.source}(?<selection>\\S+?)${pe.source}`);
        return {
            ph,
            pe,
            selection: /\S+/,
            pattern: concatPattern,
        };
    }
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
    // console.log(tree, tree.spe,  label, nodes)
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

export function intersectPattern(textSelection: ITextSelection[]): ITextPattern {
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
        if (uniques.length === 0) {
            if (textSelection.length === 1) {
                uniques = commonParents.filter((f) => f.type === 'knowledge');
            } else {
                uniques = commonParents;
            }
        } else {
            // uniques = getRepeatNodes(uniques, commonParents);
            uniques = commonParents
        }
    }
    // const commonParents = findCommonParentsOfSepcificNodesInPatternTree(patternTree);
    uniques.sort((a, b) => b.depth / b.specLabel - a.depth / a.specLabel);
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
                const patt = {
                    ph,
                    pe,
                    selection: uni.pattern,
                    pattern: new RegExp(`${ph.source}(?<selection>${uni.pattern.source})${pe.source}`),
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
        return {
            ph: /^/,
            pe: /$/,
            selection: /\S+/,
            pattern: new RegExp(`^(?<selection>\\S+?)$`),
        };
    }
    return ans[0]
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

        const patt = {
            ph,
            pe,
            selection: uni.pattern,
            pattern: new RegExp(`${ph.source}(?<selection>${uni.pattern.source})${pe.source}`),
        }
        return textList.every(text => {
            const res = extractSelection(patt ,text)
            if (res.missing) return false;
            return res.matchPos[0] === 0 && res.matchPos[1] === text.length;
        })
    })
    uniques.sort((a, b) => b.depth / b.specLabel - a.depth / a.specLabel);
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
