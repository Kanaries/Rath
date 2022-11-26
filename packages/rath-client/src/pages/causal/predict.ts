import { notify } from "../../components/error";
import type { IRow, IFieldMeta } from "../../interfaces";
import { getGlobalStore } from "../../store";


export const PredictAlgorithms = [
    { key: 'decisionTree', text: '决策树' },
    { key: 'randomForest', text: '随机森林' },
] as const;

export type PredictAlgorithm = typeof PredictAlgorithms[number]['key'];

export interface IPredictProps {
    dataSource: IRow[];
    fields: IFieldMeta[];
    model: {
        algorithm: PredictAlgorithm;
        features: string[];
        target: string[];
    };
}

export type PredictResultItem = {
    /** index */
    0: number;
    /** result */
    1: number;
} & [number, number];

export interface IPredictResult {
    accuracy: number;
    result: PredictResultItem[];
}

const PredictApiPath = 'api/classifaction';

export const execPredict = async (props: IPredictProps): Promise<IPredictResult | null> => {
    try {
        const { causalStore } = getGlobalStore();
        const { apiPrefix } = causalStore;
        const res = await fetch(`${apiPrefix}/${PredictApiPath}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(props),
        });
        const result = await res.json();
        if (result.success) {
            return result.data;
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        notify({
            title: 'Predict Service Failed',
            type: 'error',
            content: `${error}\n${error instanceof Error ? error.stack : ''}`,
        });
        // FIXME: mock
        await new Promise<void>(resolve => setTimeout(resolve, 200 + 500 * Math.random()));
        return {
            accuracy: Math.random(),
            result: props.model.features.map<[number, number]>((_, i) => [i, Math.random()]),
        };
        // return null;
    }
};
