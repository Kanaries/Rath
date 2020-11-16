import { FieldType } from "visual-insights/build/esm/commonTypes";
import { DataField } from "./index";
interface FieldTypeDictonary {
    [key: string]: DataField
}
export function inferFieldSemanticTypeWithDict(field: string, fieldTypeDict: FieldTypeDictonary): FieldType {
  return fieldTypeDict[field] ? fieldTypeDict[field].semanticType : "nominal";
}

export function inferFieldTypeWithDict(field: string, fieldTypeDict: FieldTypeDictonary): DataField["type"] {
  return fieldTypeDict[field] ? fieldTypeDict[field].type : "dimension";
}
