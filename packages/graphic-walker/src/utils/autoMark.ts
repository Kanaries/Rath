import { ISemanticType } from "visual-insights";

/**
 * 
 * @param semanticTypeList semanticTypeList.length <= 2，调用时，手动将columns 和 rows的最后一个元素组合传进来
 * @returns geom(mark) type
 */
export function autoMark(semanticTypeList: ISemanticType[]): string {
    if (semanticTypeList.length < 2) {
        if (semanticTypeList[0] === 'temporal') return 'tick'
        return 'bar'
    }
    const couter: Map<ISemanticType, number> = new Map();
    (['nominal', 'ordinal', 'quantitative', 'temporal'] as ISemanticType[]).forEach(s => {
        couter.set(s, 0)
    })
    for (let st of semanticTypeList) {
        // if (!couter.has(st)) {
        //     couter.set(st, 0);
        // }
        couter.set(st, couter.get(st)! + 1);
    }
    if (couter.get('nominal') === 1 || couter.get('ordinal') === 1) {
        return 'bar'
    }
    if (couter.get('temporal') === 1 && couter.get('quantitative') === 1) {
        return 'line'
    }
    if (couter.get('quantitative') === 2) {
        return 'point'
    }
    return 'point'
    // if (cou)
}