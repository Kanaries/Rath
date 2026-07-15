import type { IFieldMeta, IRow } from '../../interfaces';

export const PredictAlgorithms = [
    { key: 'decisionTree', text: 'Decision Tree' },
    { key: 'randomForest', text: 'Random Forest' },
    { key: 'gradientBoosting', text: 'Gradient Boosting' },
    { key: 'adaBoost', text: 'AdaBoost' },
    { key: 'XGBoost', text: 'XGBoost' },
] as const;

export type PredictAlgorithm = typeof PredictAlgorithms[number]['key'];

export enum TrainTestSplitFlag {
    test = 0,
    train = 1,
}

export enum PredictResultFlag {
    wrong = 0,
    right = 1,
}

export interface IPredictProps {
    dataSource: IRow[];
    fields: IFieldMeta[];
    model: {
        algorithm: PredictAlgorithm;
        features: string[];
        targets: string[];
    };
    /** same length to dataSource */
    trainTestSplitIndices: TrainTestSplitFlag[];
    mode: 'classification' | 'regression';
}

export type PredictResultItem = {
    /** index from the dataSource */
    0: number;
    /** is result right */
    1: PredictResultFlag;
} & [number, PredictResultFlag];

export interface IPredictResult {
    accuracy: number;
    result: PredictResultItem[];
}
