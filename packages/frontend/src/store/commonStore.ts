import { makeAutoObservable } from 'mobx';
import { BIField, Record } from '../global';
import { cleanData, CleanMethod } from '../pages/dataSource/clean';
import { deepcopy, Transform } from '../utils';

interface IRawFields extends BIField {
    disable: boolean;
}
export class CommonStore {
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
    public rawFields: IRawFields[] = [];
    // public fields: BIField[] = [];
    public cleanMethod: CleanMethod = 'dropNull';
    constructor() {
        makeAutoObservable(this);
    }

    public get fields () {
        return this.rawFields.filter(f => !f.disable);
    }

    public get dimensions() {
        return this.fields.filter((field) => field.type === 'dimension').map((field) => field.name);
    }

    public get measures() {
        return this.fields.filter((field) => field.type === 'measure').map((field) => field.name);
    }
    /**
     * column lint data. rawData formatted by column type.
     */
    public get colLintData() {
        return this.rawData.map((row) => {
            let record: Record = {};
            this.fields.forEach((field) => {
                record[field.name] = field.type === 'dimension' ? row[field.name] : Transform.transNumber(row[field.name]);
            });
            return record;
        });
    }

    public get cleanedData() {
        const { colLintData, dimensions, measures, cleanMethod } = this;
        return cleanData(deepcopy(colLintData), dimensions, measures, cleanMethod);
    }

    public async univariateSummary (dataSource: Record[], fields: BIField[]) {
        
    }
}
