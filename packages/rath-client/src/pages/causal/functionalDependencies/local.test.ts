import type { IRow } from '../../../interfaces';
import { detectFunctionalDependencies } from './local';

describe('detectFunctionalDependencies', () => {
    it('orients a nonlinear additive-noise dependency', () => {
        const dataSource: IRow[] = Array.from({ length: 64 }, (_, index) => {
            const x = (index - 32) / 16;
            return {
                x,
                y: x ** 2 + ((index % 3) - 1) * 0.01,
            };
        });

        const result = detectFunctionalDependencies({
            dataSource,
            fields: [
                { fid: 'x', name: 'X', semanticType: 'quantitative' },
                { fid: 'y', name: 'Y', semanticType: 'quantitative' },
            ],
        });

        expect(result).toEqual([
            {
                fid: 'y',
                params: [{ fid: 'x', type: 'FuncDepTest' }],
            },
        ]);
    });

    it('returns no dependencies for fewer than two fields', () => {
        expect(
            detectFunctionalDependencies({
                dataSource: [{ x: 1 }],
                fields: [{ fid: 'x', name: 'X', semanticType: 'quantitative' }],
            })
        ).toEqual([]);
    });
});
