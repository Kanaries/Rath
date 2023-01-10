import { IVegaSubset } from "../interfaces";
import { deepcopy } from "../utils";

export function vs2vl (spec: IVegaSubset): any {
    return deepcopy(spec);
}