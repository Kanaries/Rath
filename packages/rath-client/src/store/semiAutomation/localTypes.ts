import { IPattern } from '@kanaries/loa';
import { IResizeMode } from "../../interfaces";

export interface ISetting {
    vizAlgo: 'lite' | 'strict'
}
export interface IMainVizSetting {
    interactive: boolean;
    debug: boolean;
    resize: {
        mode: IResizeMode;
        width: number;
        height: number;
    };
    nlg: boolean;
    excludeScaleZero: boolean;
}

export type IRenderViewKey = 'pattViews' | 'featViews' | 'filterViews' | 'neighborViews';

export interface IAssoViews {
    views: IPattern[];
    amount: number;
    computing: boolean;
}

export const RENDER_BATCH_SIZE = 5;

export function makeInitAssoViews(initRenderAmount: number = 5): IAssoViews {
    return {
        views: [],
        amount: initRenderAmount,
        computing: false
    }
}