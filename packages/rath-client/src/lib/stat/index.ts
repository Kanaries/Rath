import { shallowCopyArray } from "../../utils/deepcopy";

export function getQuantiles(values: number[], percents: number[]) {
    const sortedValues = shallowCopyArray(values).sort((a, b) => a - b);
    const percentIndices = percents.map(p => p * values.length)
    const qts: number[] = [];
    for (let pi of percentIndices) {
        let floor_pi = Math.min(Math.floor(pi), sortedValues.length - 1);
        if (pi > Math.floor(pi)) {
            qts.push(sortedValues[floor_pi])
        } else {
            const mid = (sortedValues[floor_pi] + sortedValues[Math.min(floor_pi, sortedValues.length - 1)]) / 2;
            qts.push(mid)
        }
    }
    return qts;
}