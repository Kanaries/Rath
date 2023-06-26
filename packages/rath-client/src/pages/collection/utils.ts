import produce from "immer";
import { ISemanticType } from "@kanaries/loa";
import { IFieldMeta, IResizeMode, IVegaSubset } from "../../interfaces";
import { applySizeConfig } from "../../queries/base/utils";

function uncompressAxisSemanticType (semanticType: ISemanticType) {
    return semanticType === 'nominal' || semanticType === 'ordinal';
}

// interface Advice
export function adviceVisSize(spec: IVegaSubset, fields: IFieldMeta[], width: number | undefined = 260, height: number | undefined = 260): IVegaSubset {
    let fixed = false;
    if (spec.encoding.x) {
        const targetField = fields.find(f => f.fid === spec.encoding.x?.field);
        if (targetField) {
            if (uncompressAxisSemanticType(targetField.semanticType) && targetField.features.unique > 32) {
                fixed = true
            }
        }
    }
    if (spec.encoding.y) {
        const targetField = fields.find(f => f.fid === spec.encoding.y?.field);
        if (targetField) {
            if (uncompressAxisSemanticType(targetField.semanticType) && targetField.features.unique > 32) {
                fixed = true
            }
        }
    }
    if (fixed) return changeVisSize(spec, width, height);
    return spec;
}

export function changeVisSize(spec: IVegaSubset, propsWidth: number, propsHeight: number): IVegaSubset {
    const nextSpec = produce(spec, (draft) => {
        let width = propsWidth;
        let height = propsHeight;
        applySizeConfig(draft, {
            mode: IResizeMode.control,
            width,
            height,
            hasFacets: Boolean(spec.encoding.row || spec.encoding.column),
        });
        if (draft.encoding.x) {
            draft.encoding.x.axis = {
                labelLimit: 42,
                labelOverlap: "parity",
            }
        }
        if (draft.encoding.y) {
            draft.encoding.y.axis = {
                labelLimit: 42,
                labelOverlap: "parity",
            }
        }
    });
    return nextSpec;
}

export const VIEW_NUM_IN_PAGE = 8;