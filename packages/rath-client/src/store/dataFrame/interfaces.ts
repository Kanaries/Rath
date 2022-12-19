import { IFieldMeta, IRow } from "../../interfaces"

export interface ISeries<T> extends ArrayLike<T> {
    indices: Array<number>;
    values(...args: [number, number] | [Array<number>] | []): ISeries<T>;
    getVal(i: number): T;
}

export interface IDataFrame {
    readonly series: Map<string, ISeries<any>>;
    at(column: string, row: number): any;
    rows(...args: [] | [number, number] | [Array<number>]): IRow[];
    columns(...args: [number, number] | [Array<string>] | [Array<IFieldMeta>]): { [key: string]: ISeries<any>};
}