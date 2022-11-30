/* eslint-disable import/first */
// import 'buffer/'
import { Buffer } from 'buffer';
// @ts-ignore
if (window.Buffer === undefined) window.Buffer = Buffer;
import regexgen from 'regexgen';

const patterns = [
    {
        name: 'text',
        pattern: /(?:\w+|[\u4e00-\u9fa5]+)(?:\s+|[\u4e00-\u9fa5]+)*/g
    },
    {
        name: 'number',
        pattern: /(?:\d+)(?:\.\d+)?/g
    },
    {
        name: 'punctuation',
        pattern: /[\u0020-\u002F\u003A-\u0040\u005B-\u0060\u007B-\u007E\u00A0-\u00BF\u2000-\u206F\u3000-\u303F\uFF00-\uFFEF]+/g
    },
    {
        name: 'symbol',
        pattern: /[\u0021-\u002F\u003A-\u0040\u005B-\u0060\u007B-\u007E\u00A0-\u00BF\u2000-\u206F\u3000-\u303F\uFF00-\uFFEF]+/g
    }
];
// @ts-ignore
// console.log('window buffer', window.Buffer, regexgen)
export function initPatterns (textSelection: {str: string; startIndex: number; endIndex: number}[]) {
    console.log(textSelection)
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
        const pattern = patterns.find(p => p.name === pattName)!;
        const concatPattern = new RegExp(`${ph.source}(?<selection>${pattern.pattern.source}?)${pe.source}`);
        if (pattern) {
            return {
                ph,
                pe,
                selection: pattern.pattern,
                pattern: concatPattern
            }
        }
    } else {
        const concatPattern = new RegExp(`${ph.source}(?<selection>.+?)${pe.source}`);
        return {
            ph,
            pe,
            selection: /.+/,
            pattern: concatPattern
        }
    }
}
