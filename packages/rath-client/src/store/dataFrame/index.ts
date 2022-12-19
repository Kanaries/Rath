import { IRow, IFieldMeta, IRawField } from "../../interfaces";
import { ISeries, IDataFrame } from "./interfaces";

class IdentityArray {
    static readonly data = new Array<number>();
    static create(length: number): Array<number> {
        let t = IdentityArray.data.length;
        if (t < length) {
            IdentityArray.data.length = length;
            for (let i = t;i < length;++i) IdentityArray.data[i] = i;
        }
        return IdentityArray.data.slice(undefined, length);
    }
}

export class Series<T> implements ISeries<T> {
    readonly [n: number]: T;
    private _indices?: Array<number>;
    private _data: Array<T>;
    length: number;
    constructor(data: Array<T>, indices?: Array<number>) {
        this.length = data.length;
        this._data = data;
        if (indices) this._indices = indices;
    }
    get indices(): Array<number> {
        if (this._indices) return this._indices;
        else return this._indices = IdentityArray.create(this.length);
    }
    getVal(i: number): T {
        return this._data[this.indices[i]];
    }
    values(...args: [number|undefined, number|undefined] | [number[]] | []): ISeries<T> {
        if(args.length === 1) {
            let ind = args[0];
            return new Series<T>(this._data, ind.slice());
        }
        else if(args.length === 2) {
            return new Series<T>(this._data, this.indices.slice(args[0], args[1]));
        }
        else return this;
    }
}

export class DataFrame implements IDataFrame {
    series = new Map<string, ISeries<any>>();
    private _fields: IRawField[];
    constructor(series: { [key: string]: ISeries<any> }, fields: IRawField[]) {
        this._fields = fields;
        for (let [key, value] of Object.entries(series)) {
            this.series.set(key, value);
        }
    }
    at(column: string, row: number) {
        return this.series.get(column)?.getVal(row);
    }
    private IRowProxy(i: number): IRow {
        return new Proxy(this, {
            get(target: IDataFrame, p: string, receiver) {
                return target.series.get(p)?.getVal(i);
            }
        }) as IRow;
    }
    rows(...args: [] | [number[]] | [number, number]): IRow[] {
        throw new Error("Method not implemented.");
    }
    columns(...args: [number, number] | [string[]] | [IFieldMeta[]]): { [key: string]: ISeries<any>; } {
        throw new Error("Method not implemented.");
    }
    
}