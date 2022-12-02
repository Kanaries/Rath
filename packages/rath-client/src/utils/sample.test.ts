import type { IFieldMeta, IRow } from '../interfaces';
import { focusedSample } from './sample';


const LOREM_IPSUM = (
    'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut ' +
    'labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut ' +
    'aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore ' +
    'eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt '
).split(' ');
let loremIndex = 0;
function _lorem(wordCount: number): string {
    const startIndex = loremIndex + wordCount > LOREM_IPSUM.length ? 0 : loremIndex;
    loremIndex = startIndex + wordCount;
    return LOREM_IPSUM.slice(startIndex, loremIndex).join(' ');
}

const gaussRand = (count: number, mu: number, sigma: number): number[] => {
    let v1 = 0;
    let v2 = 0;
    let s = 0;
    let flag = true;
    return new Array<0>(count).fill(0).map<number>(_ => {
        let x = 0;
        if (flag) {
            do {
                let u1 = Math.random();
                let u2 = Math.random();
                v1 = 2 * u1 - 1;
                v2 = 2 * u2 - 1;
                s = v1 * v1 + v2 * v2;
            } while (s >= 1 || s === 0);
            x = v1 * Math.sqrt(-2 * Math.log(s) / s);
        } else {
            x = v2 * Math.sqrt(-2 * Math.log(s) / s);
        }
        flag = !flag;
        return mu + x * sigma;
    });
};

const halfGaussRand = (count: number, mu: number, sigma: number): number[] => {
    let v1 = 0;
    let v2 = 0;
    let s = 0;
    let flag = true;
    return new Array<0>(count).fill(0).map<number>(_ => {
        let x = 0;
        if (flag) {
            do {
                let u1 = Math.random();
                let u2 = Math.random();
                v1 = 2 * u1 - 1;
                v2 = 2 * u2 - 1;
                s = v1 * v1 + v2 * v2;
            } while (s >= 1 || s === 0);
            x = v1 * Math.sqrt(-2 * Math.log(s) / s);
        } else {
            x = v2 * Math.sqrt(-2 * Math.log(s) / s);
        }
        flag = !flag;
        return mu + Math.abs(x) * sigma;
    });
};

const createRandomData = (nCols: number = 10, nRows: number = 1_000): { fields: IFieldMeta[]; data: IRow[] } => {
    const fields: IFieldMeta[] = [];
    const data: IRow[] = new Array<0>(nRows).fill(0).map<IRow>(_ => ({}));

    for (let i = 0; i < nCols; i += 1) {
        const fid = `${i}:${_lorem(1)}`;
        if (Math.random() < 0.3) {
            const col = halfGaussRand(nRows, 0, Math.random() * 10);
            const [min, max] = col.reduce<[number, number]>(([min, max], d) => {
                return [
                    Math.min(min, d),
                    Math.max(max, d),
                ];
            }, [Infinity, -Infinity]);
            fields.push({
                fid,
                name: _lorem(2),
                analyticType: 'measure',
                semanticType: 'quantitative',
                geoRole: 'none',
                // @ts-ignore
                features: { min, max },
            });
            for (let j = 0; j < nRows; j += 1) {
                data[j][fid] = col[j];
            }
        } else if (Math.random() < 0.7) {
            const col = gaussRand(nRows, Math.random() * 10, Math.random() * 3);
            const [min, max] = col.reduce<[number, number]>(([min, max], d) => {
                return [
                    Math.min(min, d),
                    Math.max(max, d),
                ];
            }, [Infinity, -Infinity]);
            fields.push({
                fid,
                name: _lorem(2),
                analyticType: 'measure',
                semanticType: 'quantitative',
                geoRole: 'none',
                // @ts-ignore
                features: { min, max },
            });
            for (let j = 0; j < nRows; j += 1) {
                data[j][fid] = col[j];
            }
        } else {
            fields.push({
                fid,
                name: _lorem(2),
                analyticType: 'measure',
                semanticType: 'nominal',
                geoRole: 'none',
                // @ts-ignore
                features: {},
            });
            for (let j = 0; j < nRows; j += 1) {
                data[j][fid] = LOREM_IPSUM[Math.floor(LOREM_IPSUM.length * Math.random())];
            }
        }
    }

    return { fields, data };
};

describe('function focusedSample', () => {
    it('Sample size test (full set)', () => {
        const { data: fullSet, fields } = createRandomData(8, 100);
        const sampleRate = 1;
        const sampleSize = Math.floor(fullSet.length * sampleRate);
        const sample = focusedSample(fullSet, fields, sampleSize);

        expect(sample.length).toBe(sampleSize);
    });
    it('Sample size test (more than full set)', () => {
        const { data: fullSet, fields } = createRandomData(8, 100);
        const sampleRate = 1.5;
        const sampleSize = Math.floor(fullSet.length * sampleRate);
        const sample = focusedSample(fullSet, fields, sampleSize);

        expect(sample.length).toBe(fullSet.length);
    });
    it('Sample size test (empty)', () => {
        const { data: fullSet, fields } = createRandomData(8, 100);
        const sampleSize = 0;
        const sample = focusedSample(fullSet, fields, sampleSize);

        expect(sample.length).toBe(0);
    });
    it('Sample size test (negative)', () => {
        const { data: fullSet, fields } = createRandomData(8, 100);
        const sampleSize = -2;
        const sample = focusedSample(fullSet, fields, sampleSize);

        expect(sample.length).toBe(0);
    });
    it('Sample size test (float)', () => {
        const { data: fullSet, fields } = createRandomData(8, 100);
        const sampleSize = 33.3;
        const sample = focusedSample(fullSet, fields, sampleSize);

        expect(sample.length).toBe(33);
    });
    it('Sample size test (small set, more than half)', () => {
        const { data: fullSet, fields } = createRandomData(6, 64);
        const sampleRate = 0.8;
        const sampleSize = Math.floor(fullSet.length * sampleRate);
        const sample = focusedSample(fullSet, fields, sampleSize);

        expect(sample.length).toBe(sampleSize);
    });
    it('Sample size test (small set, less than half)', () => {
        const { data: fullSet, fields } = createRandomData(6, 64);
        const sampleRate = 0.2;
        const sampleSize = Math.floor(fullSet.length * sampleRate);
        const sample = focusedSample(fullSet, fields, sampleSize);

        expect(sample.length).toBe(sampleSize);
    });
    it('Sample size test (large set, more than half)', () => {
        const { data: fullSet, fields } = createRandomData(18, 40_000);
        const sampleRate = 0.8;
        const sampleSize = Math.floor(fullSet.length * sampleRate);
        const sample = focusedSample(fullSet, fields, sampleSize);

        expect(sample.length).toBe(sampleSize);
    });
    it('Sample size test (large set, less than half)', () => {
        const { data: fullSet, fields } = createRandomData(18, 40_000);
        const sampleRate = 0.2;
        const sampleSize = Math.floor(fullSet.length * sampleRate);
        const sample = focusedSample(fullSet, fields, sampleSize);

        expect(sample.length).toBe(sampleSize);
    });
});
