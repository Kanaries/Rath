import { IRawField, IRow, CleanMethod } from "../../interfaces";
import { Transform } from "../../utils";
import { cleanData } from "../../utils/clean";


function transformDataTypes (dataSource: IRow[], fields: IRawField[]): IRow[] {
    const ans: IRow[] = [];
    let i = 0, j = 0, size = dataSource.length, fieldNum = fields.length;
    for (i = 0; i < size; i++) {
        const record: IRow = {};
        const row = dataSource[i];
        for (j = 0; j < fieldNum; j++) {
            const field = fields[j]
            record[field.fid] = row[field.fid]
            if (field.analyticType === 'dimension') {
                if ((field.semanticType === 'temporal' && field.extInfo?.extOpt !== "dateTimeExpand") ||
                    field.semanticType === 'nominal') {
                    record[field.fid] = String(row[field.fid])
                }
            }
            if (row[field.fid] === '') {
                // beware that `Number('')` is `0`
                if (['quantitative', 'ordinal'].includes(field.semanticType)) {
                    record[field.fid] = null;
                }
                continue;
            }
            if (field.semanticType === 'quantitative') {
                record[field.fid] = Transform.transNumber(row[field.fid]);
            } else if (field.semanticType === 'ordinal' && !isNaN(Number(row[field.fid]))) {
                record[field.fid] = Transform.transNumber(row[field.fid]);
            }
        }
        ans.push(record);
    }
    return ans;
  }
  
export function cleanAndTransformData (dataSource: IRow[], fields: IRawField[], method: CleanMethod): IRow[] {
    const dimensions = fields.filter(f => f.analyticType === 'dimension').map(f => f.fid);
    const measures = fields.filter(f => f.analyticType === 'measure').map(f => f.fid);
    const t = transformDataTypes(dataSource, fields)
    const c = cleanData(t, dimensions, measures, method)
    return c
}