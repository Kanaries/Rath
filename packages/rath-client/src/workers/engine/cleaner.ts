import { IRawField, IRow, CleanMethod } from "../../interfaces";
import { Transform } from "../../utils";
import { cleanData } from "../../utils/clean";


function transformDataTypes (dataSource: IRow[], fields: IRawField[]): IRow[] {
    return dataSource.map((row) => {
        let record: IRow = {};
        fields.forEach((field) => {
            // if (field.type === 'dimension') {
            //     record[field.name] = `${row[field.name]}`
            // } else {
            //     record[field.name] = Transform.transNumber(row[field.name]);
            // }
            record[field.fid] = row[field.fid]
            if (field.analyticType === 'dimension') {
                if (field.semanticType === 'temporal' || field.semanticType === 'nominal') {
                    record[field.fid] = String(row[field.fid])
                }
            }
            if (field.semanticType === 'quantitative') {
                record[field.fid] = Transform.transNumber(row[field.fid]);
            } else if (field.semanticType === 'ordinal' && !isNaN(Number(row[field.fid]))) {
                record[field.fid] = Transform.transNumber(row[field.fid]);
            }
        });
        return record;
    });
  }
  
export function cleanAndTransformData (dataSource: IRow[], fields: IRawField[], method: CleanMethod): IRow[] {
    const dimensions = fields.filter(f => f.analyticType === 'dimension').map(f => f.fid);
    const measures = fields.filter(f => f.analyticType === 'measure').map(f => f.fid);
    const t = transformDataTypes(dataSource, fields)
    const c = cleanData(t, dimensions, measures, method)
    return c
}