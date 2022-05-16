export interface ISizeConfig {
    mode: 'auto' | 'control';
    width?: number;
    height?: number;
    stepSize?: number;
}
export function applySizeConfig(spec: any, cnf: ISizeConfig): any {
    const {
        mode,
        width,
        height,
        stepSize
    } = cnf;
    if (mode === 'auto' && typeof stepSize === 'number') {
        if (typeof width === 'number' && spec.encoding && spec.encoding.x && spec.encoding.y) {
            const xFieldType = spec.encoding.x.type;
            spec.width = (xFieldType === 'quantitative' || xFieldType === 'temporal') ? width : { step: stepSize };
            
        }
        if (typeof height === 'number' && spec.encoding && spec.encoding.y) {
            const yFieldType = spec.encoding.y.type;
            spec.height = (yFieldType === 'quantitative' || yFieldType === 'temporal') ? height : { step: stepSize };
        }
    } else {
        spec.width = width
        spec.height = height;
    }
    return spec;
}