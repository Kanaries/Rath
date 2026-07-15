import { Ensemble, Metrics, Tree, utils } from '@kanaries/ml';
import { toNumericValue } from './dataTransform';
import { PredictResultFlag, TrainTestSplitFlag, type IPredictProps, type IPredictResult, type PredictAlgorithm } from './predictTypes';

type Estimator = {
    fit(X: number[][], y: number[]): void;
    predict(X: number[][]): number[];
};

type CategoricalValue = string | number | boolean | null;

function toCategoricalValue(value: unknown): CategoricalValue {
    if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return value;
    }
    if (value === undefined) {
        return null;
    }
    if (value instanceof Date) {
        return value.toISOString();
    }
    return JSON.stringify(value);
}

function encodeCategoricalColumn(values: readonly unknown[], oneHot: boolean): number[][] {
    const matrix = values.map((value) => [toCategoricalValue(value)]);
    return oneHot ? new utils.Preprocessing.OneHotEncoder().fitTransform(matrix) : new utils.Preprocessing.OrdinalEncoder().fitTransform(matrix);
}

function encodeFeatures(props: IPredictProps): number[][] {
    const selected = new Set(props.model.features);
    const featureFields = props.fields.filter((field) => selected.has(field.fid));
    if (featureFields.length !== selected.size) {
        throw new Error('One or more prediction features no longer exist.');
    }

    const encodedColumns = featureFields.map((field) => {
        const values = props.dataSource.map((row) => row[field.fid]);
        if (field.semanticType === 'nominal') {
            const uniqueCount = new Set(values.map(toCategoricalValue)).size;
            return encodeCategoricalColumn(values, uniqueCount > 2);
        }
        if (field.semanticType === 'ordinal') {
            return encodeCategoricalColumn(values, false);
        }
        const numeric = values.map((value) => toNumericValue(value));
        if (numeric.some((value) => !Number.isFinite(value))) {
            throw new Error(`Prediction feature ${field.name ?? field.fid} contains a non-numeric value.`);
        }
        return numeric.map((value) => [value]);
    });

    return props.dataSource.map((_, rowIndex) => encodedColumns.flatMap((column) => column[rowIndex]));
}

function encodeTarget(props: IPredictProps): number[] {
    const targetId = props.model.targets[0];
    const targetField = props.fields.find((field) => field.fid === targetId);
    if (!targetField) {
        throw new Error('A prediction target is required.');
    }
    const values = props.dataSource.map((row) => row[targetField.fid]);
    if (props.mode === 'classification') {
        return encodeCategoricalColumn(values, false).map(([value]) => value);
    }

    const numeric = values.map((value) => toNumericValue(value));
    if (numeric.some((value) => !Number.isFinite(value))) {
        throw new Error(`Regression target ${targetField.name ?? targetField.fid} must be numeric.`);
    }
    return numeric;
}

function createEstimator(mode: IPredictProps['mode'], algorithm: PredictAlgorithm): Estimator {
    if (mode === 'classification') {
        switch (algorithm) {
            case 'decisionTree':
                return new Tree.DecisionTreeClassifier({ criterion: 'gini' });
            case 'randomForest':
                return new Ensemble.RandomForestClassifier({ max_depth: 3, randomState: 0 });
            case 'gradientBoosting':
                return new Ensemble.GradientBoostingClassifier({ nEstimators: 100, learningRate: 1, maxDepth: 3, randomState: 0 });
            case 'adaBoost':
                return new Ensemble.AdaBoostClassifier({ nEstimators: 100 });
            case 'XGBoost':
                return new Ensemble.XGBoostClassifier({ nEstimators: 100, maxDepth: 3, learningRate: 0.1 });
        }
    }

    switch (algorithm) {
        case 'decisionTree':
            return new Tree.DecisionTreeRegressor();
        case 'randomForest':
            return new Ensemble.RandomForestRegressor({ maxDepth: 3, randomState: 50 });
        case 'gradientBoosting':
            return new Ensemble.GradientBoostingRegressor({ nEstimators: 100, learningRate: 0.1, maxDepth: 3, randomState: 0 });
        case 'adaBoost':
            return new Ensemble.AdaBoostRegressor({ nEstimators: 100, randomState: 0 });
        case 'XGBoost':
            return new Ensemble.XGBoostRegressor({ nEstimators: 100, maxDepth: 3, learningRate: 0.1 });
    }
}

function populationStandardDeviation(values: readonly number[]): number {
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    return Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length);
}

export function executeLocalPredict(props: IPredictProps): IPredictResult {
    if (props.dataSource.length !== props.trainTestSplitIndices.length) {
        throw new Error('Train/test split must have one entry per data row.');
    }

    const X = encodeFeatures(props);
    const y = encodeTarget(props);
    const trainIndices: number[] = [];
    const testIndices: number[] = [];
    props.trainTestSplitIndices.forEach((flag, index) => {
        if (flag === TrainTestSplitFlag.train) {
            trainIndices.push(index);
        } else if (flag === TrainTestSplitFlag.test) {
            testIndices.push(index);
        }
    });
    if (trainIndices.length === 0 || testIndices.length === 0) {
        throw new Error('Prediction requires at least one training row and one test row.');
    }

    const trainX = trainIndices.map((index) => X[index]);
    const trainY = trainIndices.map((index) => y[index]);
    const testX = testIndices.map((index) => X[index]);
    const testY = testIndices.map((index) => y[index]);
    const estimator = createEstimator(props.mode, props.model.algorithm);
    estimator.fit(trainX, trainY);
    const predicted = estimator.predict(testX);
    const accuracy = props.mode === 'classification' ? Metrics.accuracyScore(testY, predicted) : Metrics.r2Score(predicted, testY);
    const regressionStd = props.mode === 'regression' ? populationStandardDeviation(testY) : 0;

    return {
        accuracy,
        result: testIndices.map((rowIndex, index) => {
            const right =
                props.mode === 'classification'
                    ? testY[index] === predicted[index]
                    : regressionStd === 0
                    ? testY[index] === predicted[index]
                    : Math.abs((testY[index] - predicted[index]) / regressionStd) <= 2;
            return [rowIndex, right ? PredictResultFlag.right : PredictResultFlag.wrong];
        }),
    };
}
