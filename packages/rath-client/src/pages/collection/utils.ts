import produce from "immer";
import { IInsightVizView, IResizeMode, IVegaSubset } from "../../interfaces";
import { applySizeConfig } from "../../queries/base/utils";

export function changeVisSize(spec: IVegaSubset, width: number, height: number): IVegaSubset {
    const nextSpec = produce(spec, (draft) => {
        applySizeConfig(draft, {
            mode: IResizeMode.control,
            width,
            height,
            hasFacets: Boolean(spec.encoding.row || spec.encoding.column),
        });
    });
    return nextSpec;
}

export function searchFilterView (searchContent: string, views: IInsightVizView[]) {
    const words = searchContent.split(/[\s,;\t]+/)
    const lookupPattern = new RegExp(`.*${words.map(w => `(${w})`).join('|')}.*`, 'i')
    return views.filter(view => {
        for (let field of view.fields) {
            if (field.name && lookupPattern.test(field.name)) return true;
            if (lookupPattern.test(field.fid)) return true;
        }
        return false
    })
}