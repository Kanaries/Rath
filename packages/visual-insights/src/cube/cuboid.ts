import { Record } from "../commonTypes";
import { StatFuncName, simpleAggregate } from "../statistics";

export class Cuboid {
    public dimensions: string[];
    public measures: string[];
    public ops: StatFuncName[];
    public state: Record[];
    public constructor (props: { dimensions: string[]; measures: string[]; ops: StatFuncName[] }) {
        const { dimensions, measures, ops } = props;
        this.dimensions = dimensions;
        this.measures = measures;
        this.ops = ops;
        this.state = [];
    }
    public setData(dataSource: Record[]): Record[] {
        this.state = simpleAggregate({
            dimensions: this.dimensions,
            measures: this.measures,
            ops: this.ops,
            dataSource
        })
        return this.state
    }
    public get size () {
        return this.state.length;
    }
}