import { makeAutoObservable } from "mobx";
import { BIField, Record } from "../global";
import { cleanData, CleanMethod } from "../pages/dataSource/clean";
import { deepcopy, Transform } from "../utils";

export class DataSourceStore {
    /**
     * raw data is fetched and parsed data or uploaded data without any other changes.
     * computed value `dataSource` will be calculated
     */
    public rawData: Record[] = [];
    /**
     * fields contains fields with `dimension` or `measure` type.
     * currently, this kind of type is not computed property unlike 'quantitative', 'nominal'...
     * This is defined by user's purpose or domain knowledge.
     */
    public fields: BIField[] = [];
    public cookedDataSource: Record[] = [];
    public cookedDimensions: string[] = [];
    public cookedMeasures: string[] = [];
    public cleanMethod: CleanMethod = 'dropNull';
    constructor() {
        makeAutoObservable(this);
    }

    public get dimensions () {
        return this.fields.filter((field) => field.type === "dimension").map((field) => field.name);
    }

    public get measures () {
        return this.fields.filter(field => field.type === 'measure').map(field => field.name)
    }

    public get dataSource () {
        return this.rawData.map((row) => {
            let record: Record = {};
            this.fields.forEach((field) => {
                record[field.name] = field.type === "dimension" ? row[field.name] : Transform.transNumber(row[field.name]);
            });
            return record;
        });
    }

    public get cleanedData () {
        const { dataSource, dimensions, measures, cleanMethod} = this;
        return cleanData(deepcopy(dataSource), dimensions, measures, cleanMethod)
    }
}
