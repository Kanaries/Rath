import { PAG_NODE } from '../pages/causal/config';
import type { IFieldMeta } from '../interfaces';
import { pickEffectEstimationPlan, summarizeCausalEstimate } from './causalEffect';

describe('pickEffectEstimationPlan', () => {
    const fields = [
        { fid: 'a', name: 'A', semanticType: 'quantitative', analyticType: 'dimension' },
        { fid: 'b', name: 'B', semanticType: 'quantitative', analyticType: 'dimension' },
        { fid: 'y', name: 'Y', semanticType: 'quantitative', analyticType: 'measure' },
    ] as IFieldMeta[];

    it('prefers autopilot measure as outcome and graph parents as treatments', () => {
        const plan = pickEffectEstimationPlan(
            [
                { src: 'a', tar: 'y', src_type: PAG_NODE.EMPTY, tar_type: PAG_NODE.ARROW },
                { src: 'b', tar: 'y', src_type: PAG_NODE.EMPTY, tar_type: PAG_NODE.ARROW },
            ],
            fields,
            {
                dimensions: ['a'],
                measures: ['y'],
                title: 'AutoPilot: a → y',
            },
        );

        expect(plan).toEqual({
            targetFid: 'y',
            treatmentFids: ['a', 'b'],
        });
    });

    it('returns null when no treatments can be inferred', () => {
        const plan = pickEffectEstimationPlan([], fields, null);
        expect(plan).toBeNull();
    });
});

describe('summarizeCausalEstimate', () => {
    it('extracts numeric estimate values when present', () => {
        const result = summarizeCausalEstimate('CausalEstimate(value=0.42, ...)');
        expect(result.value).toBeCloseTo(0.42);
        expect(result.summary).toContain('0.42');
    });

    it('returns trimmed summary for free-form strings', () => {
        const result = summarizeCausalEstimate('  custom estimate text  ');
        expect(result.summary).toBe('custom estimate text');
    });
});
