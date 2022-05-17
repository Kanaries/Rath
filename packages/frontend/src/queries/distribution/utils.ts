export interface IDistVizSizeConfig {
    mode: 'auto' | 'control';
    width?: number;
    height?: number;
}
export function applySizeConfig2DistViz(spec: any, cnf: IDistVizSizeConfig): any {
    const {
        mode,
        width,
        height
    } = cnf;
    if (mode === 'control') {
        spec.width = width
        spec.height = height;
        if (!spec.encoding.row && !spec.encoding.column) {
            spec.autosize = 'fit';
        }
    }
    return spec;
}

export function applyInteractiveParams2DistViz(spec: any): any {
    if (!(spec.params instanceof Array)) {
        spec.params = []
    }
    spec.params.push({
        name: 'grid',
        select: 'interval',
        bind: 'scales'
    })
}