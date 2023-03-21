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

import { IFieldMeta } from '@kanaries/loa';
import { ITextPattern } from '../../../lib/textPattern';
import { IFieldMetaWithExtSuggestions } from '../../../interfaces';
import { IFieldTextPattern } from './components/tpRegexEditor';

export function uniquePattern(textPatternList: ITextPattern[]): ITextPattern[] {
    const keySet: Set<string> = new Set();
    const ans: ITextPattern[] = [];
    for (let tp of textPatternList) {
        if (!keySet.has(tp.pattern.source)) {
            ans.push(tp);
            keySet.add(tp.pattern.source);
        }
    }
    return ans;
}

export function groupTextPattern(textPatternList: IFieldTextPattern[]): {
    [key in IFieldTextPattern['selectionType']]: IFieldTextPattern[];
} {
    const res: {
        [key in IFieldTextPattern['selectionType']]: IFieldTextPattern[];
    } = {
        knowledge: [],
        generalize: [],
        specific: [],
        nlp: []
    };
    for (let tp of textPatternList) {
        res[tp.selectionType].push(tp);
    }
    return res;
}

export function initGroupedTextPatternList(): {
    [key in IFieldTextPattern['selectionType']]: IFieldTextPattern[];
} {
    const res: {
        [key in IFieldTextPattern['selectionType']]: IFieldTextPattern[];
    } = {
        knowledge: [],
        generalize: [],
        specific: [],
        nlp: []
    };
    return res;
}

type ITPPos = {
    groupKey: IFieldTextPattern['selectionType'];
    index: number;
};
/**
 * find the first exist text pattern (sorted by score)
 */
export function findFirstExistTextPattern(
    groupedTextPatternList: {
        [key in IFieldTextPattern['selectionType']]: IFieldTextPattern[];
    },
    enhanceKeys: IFieldTextPattern['selectionType'][] | undefined = []
): ITPPos {
    const groupKeys = (['knowledge', 'generalize', 'specific', 'nlp'] as IFieldTextPattern['selectionType'][]).filter((k) => !enhanceKeys.includes(k));
    const createPatternsOfKeys = (keys: IFieldTextPattern['selectionType'][]) => {
        const _patterns: { pattern: IFieldTextPattern; pos: ITPPos }[] = [];
        for (let groupKey of keys) {
            for (let i = 0; i < groupedTextPatternList[groupKey].length; i++) {
                _patterns.push({
                    pattern: groupedTextPatternList[groupKey][i],
                    pos: {
                        groupKey,
                        index: i,
                    },
                });
            }
        }
        return _patterns;
    };
    const patterns = createPatternsOfKeys(groupKeys);
    const enhancedPatterns = createPatternsOfKeys(enhanceKeys);
    patterns.sort((a, b) => b.pattern.score - a.pattern.score);
    enhancedPatterns.sort((a, b) => b.pattern.score - a.pattern.score);

    if (enhancedPatterns.length > 0) {
        return enhancedPatterns[0].pos;
    }
    if (patterns.length > 0) {
        return patterns[0].pos;
    }
    return {
        groupKey: 'knowledge',
        index: 0,
    };
}

export function pickFieldMetaFromFieldMetaWithSuggestions(fms: IFieldMetaWithExtSuggestions | undefined): IFieldMeta | undefined {
    if (typeof fms === 'undefined')return;
    const { extSuggestions, ...fieldMeta } = fms;
    return fieldMeta;
}
