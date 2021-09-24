import { StatFuncName } from "visual-insights/build/esm/statistics";
import { AggFC } from 'cube-core/built/types';
import { IMutField as VIMutField } from 'visual-insights';
export interface Record {
    [key: string]: any;
}

export type SemanticType = 'quantitative' | 'nominal' | 'ordinal' | 'temporal';

export interface Filters {
    [key: string]: any[];
}

export interface IField {
    key: string;
    type: string;
    analyticType: 'dimension' | 'measure';
}

export type IMutField = VIMutField;

/**
 * @deprecated
 */
export interface Field {
    /**
     * id: key in data record
     */
    id: string;
    /**
     * display name for field
     */
    name: string;
    /**
     * aggregator's name
     */
    aggName?: string;
    type: 'D' | 'M';
    [key: string]: any;
    cmp?: (a: any, b: any) => number;
}

export interface IViewField {
    /**
     * id: key in data record
     */
     id: string;
     /**
      * display name for field
      */
     name: string;
     /**
      * aggregator's name
      */
     aggName?: string;
     type: 'D' | 'M';
     [key: string]: any;
     cmp?: (a: any, b: any) => number;
}

export interface Measure extends Field {
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