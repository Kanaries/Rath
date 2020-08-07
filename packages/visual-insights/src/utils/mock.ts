import { Record } from '../commonTypes';

const DIM_CARDINALITY = 8;
const DIM_PREFIX = "dim";
const MEA_PREFIX = "mea";
export interface Dataset {
    dataSource: Record[];
    dimensions: string[];
    measures: string[];
}
export function mockDataSet(size: number = 10000, dimNum: number = 4, meaNum: number = 6): Dataset {
    const data: Record[] = [];
    const dimensions: string[] = [];
    const measures: string[] = [];
    for (let j = 0; j < dimNum; j++) {
        const dimKey = `${DIM_PREFIX}_${j}`;
        dimensions.push(dimKey);
    }
    for (let j = 0; j < meaNum; j++) {
        const meaKey = `${MEA_PREFIX}_${j}`;
        measures.push(meaKey);
    }
    for (let i = 0; i < size; i++) {
        let row: Record = {};
        for (let dimKey of dimensions) {
            row[dimKey] = `${dimKey}_${Math.floor(Math.random() * DIM_CARDINALITY)}`;
        }
        for (let meaKey of measures) {
            row[meaKey] = Math.random() * 100;
        }
        data.push(row);
    }
    return {
        dataSource: data,
        dimensions,
        measures,
    };
}
