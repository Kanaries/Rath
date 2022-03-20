import { StatFuncName } from "visual-insights/build/esm/statistics";
import { AggFC } from 'cube-core/built/types';
import { IAnalyticType, IMutField as VIMutField, ISemanticType } from 'visual-insights';
export interface Record {
    [key: string]: any;
}

export type SemanticType = 'quantitative' | 'nominal' | 'ordinal' | 'temporal';

export interface Filters {
    [key: string]: any[];
}

export interface IMutField {
    fid: string;
    name?: string;
    disable?: boolean;
    semanticType: ISemanticType;
    analyticType: IAnalyticType;
};

export interface IField {
    /**
     * fid: key in data record
     */
    fid: string;
    /**
     * display name for field
     */
    name: string;
    /**
     * aggregator's name
     */
    aggName?: string;
    semanticType: ISemanticType;
    analyticType: IAnalyticType;
    cmp?: (a: any, b: any) => number;
}

export interface IViewField extends IField {
    dragId: string;
}

export interface Measure extends IField {
    aggregator?: AggFC;
    minWidth?: number;
    formatter?: (value: number | undefined) => number | string;
    [key: string]: any;
}

export interface DataSet {
    id: string;
    name: string;
    rawFields: IMutField[];
    dataSource: Record[];
}

export interface IFieldNeighbor {
    key: string;
    cc: number;
}

export interface IMeasure {
    key: string;
    op: StatFuncName
}

export interface IDataSet {
    id: string;
    name: string;
    rawFields: IMutField[];
    dsId: string;
}
/**
 * use as props to create a new dataset(IDataSet).
 */
export interface IDataSetInfo {
    name: string;
    rawFields: IMutField[];
    dataSource: Record[]
}

export interface IDataSource {
    id: string;
    data: Record[]
}
export interface DraggableFieldState {
    fields: IField[];
    rows: IField[];
    columns: IField[];
    color: IField[];
    opacity: IField[];
    size: IField[];
}

export interface IDraggableStateKey {
    id: keyof DraggableFieldState;
    name: string;
    mode: number
}