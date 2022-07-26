import { IFieldMeta, IRow } from "../interfaces";

export function temporalExtend (dataSource: IRow[], fields: IFieldMeta[]) {
    const temporalFields = fields.filter(f => f.semanticType === 'temporal');
    
}