import { IRow } from "@kanaries/loa";
import { Sampling } from "visual-insights";

export function baseDemoSample (data: IRow[], sampleSize: number): IRow[] {
    return Sampling.reservoirSampling(data, sampleSize)
}