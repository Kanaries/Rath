import { Metrics, Tree } from '@kanaries/ml';
import type { IFieldMeta, IRow } from '../../interfaces';
import { executeLocalPredict } from './predictLocal';
import { PredictAlgorithms, TrainTestSplitFlag, type IPredictProps } from './predictTypes';

function makeField(field: Pick<IFieldMeta, 'fid' | 'name' | 'semanticType' | 'analyticType'>): IFieldMeta {
    return {
        ...field,
        geoRole: 'none',
        features: {
            entropy: 0,
            maxEntropy: 0,
            unique: 0,
        },
        distribution: [],
    };
}

const fields: IFieldMeta[] = [
    makeField({
        fid: 'x',
        name: 'Feature',
        semanticType: 'quantitative',
        analyticType: 'measure',
    }),
    makeField({
        fid: 'group',
        name: 'Group',
        semanticType: 'nominal',
        analyticType: 'dimension',
    }),
    makeField({
        fid: 'classTarget',
        name: 'Class',
        semanticType: 'nominal',
        analyticType: 'dimension',
    }),
    makeField({
        fid: 'regressionTarget',
        name: 'Value',
        semanticType: 'quantitative',
        analyticType: 'measure',
    }),
];

const dataSource: IRow[] = Array.from({ length: 40 }, (_, index) => {
    const x = index % 10;
    return {
        x,
        group: index % 3 === 0 ? 'a' : index % 3 === 1 ? 'b' : 'c',
        classTarget: x >= 5 ? 'high' : 'low',
        regressionTarget: x * 2 + (index % 2) * 0.1,
    };
});

const split = dataSource.map((_, index) => (index % 5 === 0 ? TrainTestSplitFlag.test : TrainTestSplitFlag.train));

function makeProps(algorithm: IPredictProps['model']['algorithm'], mode: IPredictProps['mode']): IPredictProps {
    return {
        dataSource,
        fields,
        model: {
            algorithm,
            features: ['x', 'group'],
            targets: [mode === 'classification' ? 'classTarget' : 'regressionTarget'],
        },
        trainTestSplitIndices: split,
        mode,
    };
}

describe('executeLocalPredict', () => {
    it.each(PredictAlgorithms.map(({ key }) => key))('runs %s classification locally', (algorithm) => {
        const result = executeLocalPredict(makeProps(algorithm, 'classification'));

        expect(Number.isFinite(result.accuracy)).toBe(true);
        expect(result.result.map(([index]) => index)).toEqual([0, 5, 10, 15, 20, 25, 30, 35]);
    });

    it.each(PredictAlgorithms.map(({ key }) => key))('runs %s regression locally', (algorithm) => {
        const result = executeLocalPredict(makeProps(algorithm, 'regression'));

        expect(Number.isFinite(result.accuracy)).toBe(true);
        expect(result.result).toHaveLength(8);
    });

    it('scores regression predictions against the true target distribution', () => {
        const props = makeProps('decisionTree', 'regression');
        props.model.features = ['x'];
        const result = executeLocalPredict(props);
        const trainRows = dataSource.filter((_, index) => split[index] === TrainTestSplitFlag.train);
        const testRows = dataSource.filter((_, index) => split[index] === TrainTestSplitFlag.test);
        const estimator = new Tree.DecisionTreeRegressor();
        estimator.fit(
            trainRows.map((row) => [row.x as number]),
            trainRows.map((row) => row.regressionTarget as number)
        );
        const predicted = estimator.predict(testRows.map((row) => [row.x as number]));
        const expected = testRows.map((row) => row.regressionTarget as number);

        expect(result.accuracy).toBeCloseTo(Metrics.r2Score(predicted, expected));
        expect(result.accuracy).not.toBeCloseTo(Metrics.r2Score(expected, predicted));
    });

    it('keeps the local train/test flags explicit', () => {
        expect(TrainTestSplitFlag.train).toBe(1);
        expect(TrainTestSplitFlag.test).toBe(0);
    });
});
