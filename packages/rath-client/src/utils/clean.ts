import { Cleaner } from "visual-insights"
import { CleanMethod, IRow } from "../interfaces";
import { shallowCopyArray } from "./deepcopy";
const { dropNull, simpleClean, useMode: replaceByMode } = Cleaner;

function unClean(dataSource: IRow[]) {
    return shallowCopyArray(dataSource);
}

export function cleanData(dataSource: IRow[], dimensions: string[], measures: string[], method: CleanMethod): IRow[] {
    // hint: dropNull works really bad when we test titanic dataset.
    // useMode fails when there are more null values than normal values;
    switch (method) {
        case 'dropNull':
            return dropNull(dataSource, dimensions, measures);
        case 'useMode':
            return replaceByMode(dataSource, dimensions.concat(measures));
        case 'simpleClean':
            return simpleClean(dataSource, dimensions, measures);
        case 'none':
        default:
            return unClean(dataSource);
    }
}