import { makeAutoObservable, observable } from "mobx";
import { BIField, BIFieldType, Record } from "../global";
import { IRawField, IRow } from "../interfaces";
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
    public mutFields: IRawField[] = [];
    // public fields: BIField[] = [];
    public cookedDataSource: Record[] = [];
    public cookedDimensions: string[] = [];
    public cookedMeasures: string[] = [];
    public cleanMethod: CleanMethod = 'dropNull';

    constructor() {
        makeAutoObservable(this, {
            rawData: observable.ref,
            cookedDataSource: observable.ref,
            cookedMeasures: observable.ref,
            // subscriptions: false
        });
    }

    public get fields () {
        return this.mutFields.filter(f => !f.disable);
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

    public setCleanMethod (method: CleanMethod) {
        this.cleanMethod = method;
    }

    public updateFieldBIType (type: BIFieldType, fieldKey: string) {
        const target = this.mutFields.find(f => f.name === fieldKey);
        if (target) {
            target.type = type;
        }
    }
    // public updateFieldInfo <K extends keyof IRawField> (fieldId: string, fieldPropKey: K, value: IRawField[K]) {
    public updateFieldInfo (fieldId: string, fieldPropKey: string, value: any) {
        // type a = keyof IRawField
        const target = this.mutFields.find(f => f.name === fieldId);
        if (target) {
            // @ts-ignore
            target[fieldPropKey] = value;
            // target.type = type;
        }
    }

    public loadData (fields: BIField[], rawData: IRow[]) {
        this.mutFields = fields.map(f => ({
            ...f,
            disable: false
        }))
        this.rawData = rawData
    }
}
