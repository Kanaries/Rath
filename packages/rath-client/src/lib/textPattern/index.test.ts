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

import { intersectPattern, textPatternInduction, extractSelection } from './index';
import type { ITextPattern, ITextSelection } from './interfaces';

/** build a selection by locating `sub` inside `str` (first occurrence) */
function sel(str: string, sub: string): ITextSelection {
    const startIndex = str.indexOf(sub);
    if (startIndex < 0) throw new Error(`"${sub}" not found in "${str}"`);
    return { str, startIndex, endIndex: startIndex + sub.length };
}

function extract(pattern: ITextPattern, text: string): string | null {
    const res = extractSelection(pattern, text);
    return res.missing ? null : res.matchedText;
}

const GROUP_ORDER: ITextPattern['selectionType'][] = ['knowledge', 'generalize', 'specific', 'nlp'];

/**
 * mimic how the dataTable UI picks the pattern to apply
 * (uniquePattern + groupTextPattern + findFirstExistTextPattern):
 * dedupe by source, order by group, stable-sort by score desc.
 * With a single selection the UI prefers the knowledge group (enhanceKeys).
 */
function pickBest(patterns: ITextPattern[], preferKnowledge = false): ITextPattern {
    const seen = new Set<string>();
    const uniq = patterns.filter((p) => {
        if (seen.has(p.pattern.source)) return false;
        seen.add(p.pattern.source);
        return true;
    });
    const grouped = GROUP_ORDER.flatMap((t) => uniq.filter((p) => p.selectionType === t));
    grouped.sort((a, b) => b.score - a.score);
    if (preferKnowledge) {
        const knowledge = grouped.find((p) => p.selectionType === 'knowledge');
        if (knowledge) return knowledge;
    }
    if (grouped.length === 0) throw new Error('no pattern candidates');
    return grouped[0];
}

describe('intersectPattern: core interactions', () => {
    test('single selection generalizes to a knowledge pattern (Titanic titles)', () => {
        const patterns = intersectPattern([sel('Braund, Mr. Owen Harris', 'Mr')]);
        const best = pickBest(patterns, true);
        expect(best.selectionType).toBe('knowledge');
        expect(extract(best, 'Braund, Mr. Owen Harris')).toBe('Mr');
        expect(extract(best, 'Heikkinen, Miss. Laina')).toBe('Miss');
        expect(extract(best, 'Cumings, Mrs. John Bradley')).toBe('Mrs');
        expect(extract(best, 'Uruchurtu, Don. Manuel')).toBe('Don');
    });

    test('re-selecting the same token narrows to a literal pattern', () => {
        const patterns = intersectPattern([
            sel('Braund, Mr. Owen Harris', 'Mr'),
            sel('Smith, Mr. John', 'Mr'),
        ]);
        const best = pickBest(patterns);
        expect(extract(best, 'Allen, Mr. William')).toBe('Mr');
        expect(extract(best, 'Heikkinen, Miss. Laina')).toBeNull();
        expect(extract(best, 'Cumings, Mrs. John Bradley')).toBeNull();
    });

    test('selecting extra literal variants extends the union (补选)', () => {
        const patterns = intersectPattern([
            sel('bar: 1', 'bar'),
            sel('foo: 2', 'foo'),
            sel('barx: 3', 'barx'),
        ]);
        const best = pickBest(patterns);
        expect(best.selectionType).toBe('generalize');
        expect(extract(best, 'bar: 4')).toBe('bar');
        expect(extract(best, 'foo: 7')).toBe('foo');
        // regression: `^bar|foo$` mis-anchoring used to drop 'barx' from the union
        expect(extract(best, 'barx: 5')).toBe('barx');
        expect(extract(best, 'quux: 9')).toBeNull();
    });

    test('extracts month from a date-time column', () => {
        const best = pickBest(intersectPattern([sel('2021-07-08 14', '07')]), true);
        expect(extract(best, '2021-07-08 14')).toBe('07');
        expect(extract(best, '2022-11-30 09')).toBe('11');
        expect(extract(best, '1999-01-05 23')).toBe('01');
    });

    test('extracts year-month composite from a date-time column', () => {
        const best = pickBest(intersectPattern([sel('2021-07-08 14', '2021-07')]), true);
        expect(extract(best, '2021-07-08 14')).toBe('2021-07');
        expect(extract(best, '2022-11-30 09')).toBe('2022-11');
    });
});

describe('intersectPattern: regressions', () => {
    test('selections mixing string-boundary and mid-string positions keep a verified pattern', () => {
        // one selection at the very start of the string, one mid-string:
        // no induced head-context can verify on both, the empty context must remain a candidate
        const patterns = intersectPattern([
            sel('Braund, Mr. Owen Harris', 'Mr'),
            sel('Mr. John Smith', 'Mr'),
        ]);
        const best = pickBest(patterns);
        // used to collapse to the score-0 catch-all `^.*(?<selection>Mr).*$`
        expect(best.score).toBeGreaterThan(0);
        expect(extract(best, 'Mr. Owen')).toBe('Mr');
        expect(extract(best, 'Braund, Mr. Owen Harris')).toBe('Mr');
        // the catch-all used to wrongly extract 'Mr' out of 'Mrs'
        expect(extract(best, 'Mrs. Jane Doe')).toBeNull();
    });

    test('selections containing regex metacharacters produce a correct union (no double escaping)', () => {
        const patterns = intersectPattern([
            sel('Braund, Mr. Owen', 'Mr.'),
            sel('Heikkinen, Miss. Laina', 'Miss.'),
        ]);
        const best = pickBest(patterns);
        // used to be corrupted into /M(?:iss|r\\\.)/ and filtered out by verification
        expect(best.selectionType).toBe('generalize');
        expect(extract(best, 'Smith, Mr. John')).toBe('Mr.');
        expect(extract(best, 'Moran, Miss. Anna')).toBe('Miss.');
        expect(extract(best, 'Cumings, Mrs. John Bradley')).toBeNull();
    });

    test('metacharacter selections stay literal in the generated pattern', () => {
        const patterns = intersectPattern([sel('k: a+b', 'a+b'), sel('k: x+y', 'x+y')]);
        const best = pickBest(patterns);
        expect(extract(best, 'k: a+b')).toBe('a+b');
        expect(extract(best, 'k: x+y')).toBe('x+y');
        // '+' must not act as a quantifier and unions must not leak past their boundary
        expect(extract(best, 'k: ab')).toBeNull();
        expect(extract(best, 'k: m+n')).toBeNull();
    });
});

describe('intersectPattern: invariants', () => {
    const SCENARIOS: ITextSelection[][] = [
        [sel('Braund, Mr. Owen Harris', 'Mr')],
        [sel('Braund, Mr. Owen Harris', 'Mr'), sel('Smith, Mr. John', 'Mr')],
        [sel('Braund, Mr. Owen Harris', 'Mr'), sel('Mr. John Smith', 'Mr')],
        [sel('Braund, Mr. Owen', 'Mr.'), sel('Heikkinen, Miss. Laina', 'Miss.')],
        [sel('2021-07-08 14', '07')],
        [sel('2021-07-08 14', '2021-07')],
        [sel('bar: 1', 'bar'), sel('foo: 2', 'foo'), sel('barx: 3', 'barx')],
    ];

    test('every verified candidate reproduces the exact user selections', () => {
        for (const selections of SCENARIOS) {
            const patterns = intersectPattern(selections);
            expect(patterns.length).toBeGreaterThan(0);
            for (const pattern of patterns) {
                if (pattern.score <= 0) continue; // the catch-all fallback is unverified by design
                for (const s of selections) {
                    const res = extractSelection(pattern, s.str);
                    expect(res.missing).toBe(false);
                    if (!res.missing) {
                        expect(res.matchPos).toEqual([s.startIndex, s.endIndex]);
                    }
                }
            }
        }
    });
});

describe('direct evaluation of the knowledge base (multi-path)', () => {
    test('a string is abstracted along every matching branch, not just the first', () => {
        // the isoDate node is unreachable under greedy single-path insertion:
        // its parent `text` rejects digit-initial strings, so '2021-07-08' never descended into it
        const nodes = textPatternInduction(['2021-07-08', '1999-12-31']);
        expect(nodes.some((n) => n.name === 'isoDate' && n.type === 'knowledge')).toBe(true);
    });

    test('full-cell date selection yields a semantic date pattern', () => {
        const best = pickBest(intersectPattern([sel('2021-07-08', '2021-07-08')]), true);
        expect(best.selectionType).toBe('knowledge');
        expect(extract(best, '1999-12-31')).toBe('1999-12-31');
        expect(extract(best, 'hello world')).toBeNull();
    });

    test('literal union is offered even when selections diverge across knowledge branches', () => {
        // '07' (integer) and 'abc' (word) share no deep knowledge node;
        // the old CA computation lost the union candidate entirely in this case
        const patterns = intersectPattern([sel('id: 07', '07'), sel('id: abc', 'abc')]);
        const best = pickBest(patterns);
        expect(best.selectionType).toBe('generalize');
        expect(extract(best, 'id: 07')).toBe('07');
        expect(extract(best, 'id: abc')).toBe('abc');
        expect(extract(best, 'id: xyz')).toBeNull();
    });

    test('candidates are independent of selection order', () => {
        const a = sel('Braund, Mr. Owen', 'Mr.');
        const b = sel('Heikkinen, Miss. Laina', 'Miss.');
        const sources = (patterns: ITextPattern[]) => patterns.map((p) => p.pattern.source).sort();
        expect(sources(intersectPattern([a, b]))).toEqual(sources(intersectPattern([b, a])));
    });
});

describe('textPatternInduction', () => {
    test('induced nodes full-match every input string', () => {
        const inputs = ['2021-07-08', '1999-12-31'];
        const nodes = textPatternInduction(inputs);
        expect(nodes.length).toBeGreaterThan(0);
        for (const node of nodes) {
            const anchored = new RegExp(`^(?:${node.pattern.source})$`);
            for (const input of inputs) {
                expect(anchored.test(input)).toBe(true);
            }
        }
    });

    test('word-like inputs induce a knowledge-level abstraction', () => {
        const nodes = textPatternInduction(['Mr', 'Miss', 'Dr']);
        expect(nodes.some((n) => n.type === 'knowledge')).toBe(true);
    });
});

describe('extractSelection', () => {
    const pattern: ITextPattern = {
        ph: /-/,
        pe: /-/,
        selection: /\d+/,
        pattern: /(?:-)(?<selection>\d+)(?:-)/,
        selectionType: 'knowledge',
        score: 1,
    };

    test('returns matched text with exact positions', () => {
        const res = extractSelection(pattern, '2021-07-08');
        expect(res.missing).toBe(false);
        if (!res.missing) {
            expect(res.matchedText).toBe('07');
            expect(res.matchPos).toEqual([5, 7]);
        }
    });

    test('returns missing for empty and non-matching input', () => {
        expect(extractSelection(pattern, '').missing).toBe(true);
        expect(extractSelection(pattern, 'no digits here').missing).toBe(true);
    });
});
