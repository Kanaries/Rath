export type Aggregator = 'sum' | 'mean' | 'count';

export type OperatorType = 'sum' | 'mean' | 'count';

export enum IDataSourceType {
    FILE = 'file',
    RESTFUL = 'restful',
    DATABASE = 'database',
    DEMO = 'demo',
    OLAP = 'olap',
    LOCAL = 'local',
    AIRTABLE = 'airtable',
}

export const globalRef: {
    baseVisSpec: any;
} = {
    baseVisSpec: null,
};

export const AGGREGATION_LIST: Array<{ key: Aggregator; text: string }> = [
    { key: 'sum', text: 'Sum' },
    { key: 'count', text: 'Count' },
    { key: 'mean', text: 'Mean' },
];
