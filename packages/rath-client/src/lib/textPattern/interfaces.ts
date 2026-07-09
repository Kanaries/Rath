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


export type ITextPatternType = 'knowledge' | 'generalize' | 'specific' | 'nlp';
export interface IPatternNode {
    pattern: RegExp;
    name: string;
    children: IPatternNode[];
    type: ITextPatternType;
    /** for `specific` nodes: the raw (unescaped) selected string, used as regexgen input */
    raw?: string;
    [key: string]: any;
}
export interface ITextSelection {
    str: string;
    startIndex: number;
    endIndex: number;
}

/** how a pattern performs on the actual column data (computed on a sample) */
export interface ITextPatternStats {
    /** sampled non-empty cell count */
    total: number;
    /** cells where extraction succeeded */
    matched: number;
    /** matched / total, 0 when the sample is empty */
    matchRate: number;
    /** cardinality of the extracted values */
    distinct: number;
}

export interface ITextPattern {
    ph: RegExp;
    pe: RegExp;
    selection: RegExp;
    pattern: RegExp;
    selectionType: ITextPatternType;
    score: number;
    stats?: ITextPatternStats;
}