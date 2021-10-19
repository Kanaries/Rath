import { IRow } from "../../interfaces";
import { rathEngineService } from "../../service";

export enum VizViewType {
    clickhouse = 'clickhouse',
    browser = 'browser'
}
export class VizView {
    public dimensions: string[] = [];
    public measures: string[] = [];
    public aggregators: string[] = [];
    public type: VizViewType = VizViewType.browser;
    constructor (type: VizViewType, dimensions: string[], measures: string[], aggregators: string[]) {
        this.dimensions = dimensions;
        this.measures = measures;
        this.aggregators = aggregators;
        this.type = type;
    }
    public async queryData () {
        const data = await this.queryLocalData();
        return data;
    }
    private async queryLocalData (): Promise<IRow[]> {
        const { dimensions, measures, aggregators } = this;
        const res = await rathEngineService({
            task: 'cube',
            props: {
                dimensions,
                measures,
                aggregators
            }
        })
        if (res.success) {
            return res.data
        }
        return [];
    }
    // private async queryClickHouse (): Promise<IRow[]> {

    // }
}