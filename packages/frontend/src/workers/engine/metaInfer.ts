import { IAnalyticType, IRow, ISemanticType } from "visual-insights";
import { IMuteFieldBase, IRawField } from "../../interfaces";
import { inferAnalyticType, inferSemanticType } from "../../utils";

export function inferMeta (props: { dataSource: IRow[]; fields: IMuteFieldBase[] }) {
    const { dataSource, fields } = props;
    const finalFieldMetas: IRawField[] = [];
    for (let field of fields) {
        const semanticType: ISemanticType = field.semanticType === '?' ? inferSemanticType(dataSource, field.fid) : field.semanticType;
        const analyticType: IAnalyticType = field.analyticType === '?' ? inferAnalyticType(dataSource, field.fid) : field.analyticType;
        finalFieldMetas.push({
            fid: field.fid,
            name: field.name ? field.name : field.fid,
            analyticType,
            semanticType,
            disable: field.disable
        })
    }
    return finalFieldMetas
}