import { Record } from '../../commonTypes';
import { VisualInsights } from './index';
export type ISemanticType = 'quantitative' | 'nominal' | 'ordinal' | 'temporal';
export type IDataType = 'number' | 'integer' | 'boolean' | 'date' | 'string';
export type IAnalyticType = 'dimension' | 'measure';
export interface IField {
    key: string;
    name?: string;
    analyticType: IAnalyticType;
    semanticType: ISemanticType;
    dataType: IDataType;
}

export interface IFieldSummary extends IField {
    domain: Set<any>;
}

export type FieldDictonary = Map<string, IFieldSummary>;

export interface IInsightSpace {
    dimensions: string[];
    measures: string[];
    type?: string;
    score?: number;
    significance: number;
    impurity?: number;
    description?: any;
}

export type InsightWorker = (
    aggData: Record[],
    dimensions: string[],
    measures: string[],
    fieldDictonary: FieldDictonary,
    context: VisualInsights
) => Promise<IInsightSpace | null>;