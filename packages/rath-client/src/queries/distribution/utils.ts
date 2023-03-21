import { IFieldMeta, IResizeMode } from "../../interfaces";

export interface IDistVizSizeConfig {
    mode: IResizeMode;
    width?: number;
    height?: number;
    stepSize?: number;
}
export function applySizeConfig2DistViz(spec: any, cnf: IDistVizSizeConfig): any {
    const {
        mode,
        width,
        height,
        stepSize
    } = cnf;
    if (mode === IResizeMode.control) {
        spec.width = width
        spec.height = height;
        if (!spec.encoding.row && !spec.encoding.column) {
            spec.autosize = 'fit';
        }
        if (spec.encoding && spec.encoding.x) {
            spec.encoding.x.axis = { labelOverlap: true }
        }
        if (spec.encoding && spec.encoding.y) {
            spec.encoding.y.axis = { labelOverlap: true }
        }
    } else {
        if (typeof stepSize === 'number') {
            if (typeof width === 'number' && spec.encoding && spec.encoding.x && spec.encoding.y) {
                const xFieldType = spec.encoding.x.type;
                spec.width = (xFieldType === 'quantitative' || xFieldType === 'temporal') ? width : { step: stepSize };
                
            }
            if (typeof height === 'number' && spec.encoding && spec.encoding.y) {
                const yFieldType = spec.encoding.y.type;
                spec.height = (yFieldType === 'quantitative' || yFieldType === 'temporal') ? height : { step: stepSize };
            }
        }
        if (spec.mark === 'circle' || spec.mark.type === 'circle' || spec.mark === 'point' || spec.mark.type === 'point') {
            if (spec.encoding.size) {
                if (!spec.encoding.size.scale) {
                    spec.encoding.size.scale = {}
                }
                spec.encoding.size.scale = { range: [10, Math.min(width ?? 200, height ?? 200)] }
            }
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

export function applyDefaultSort (spec: any, fields: IFieldMeta[]): any {
    if (spec.encoding.x && spec.encoding.y) {
        const channels = [spec.encoding.x , spec.encoding.y];
        const quanChannel = channels.find(c => c.type === 'quantitative');
        const nomChannel = channels.find(c => c.type === 'nominal');
        if (quanChannel && nomChannel) {
            const nomField = fields.find(f => f.fid === nomChannel.field);
            const quanField = fields.find(f => f.fid === quanChannel.field);
            if (nomField && quanField && nomField.features.unique > 2) {
                nomChannel.sort = {
                    field: quanChannel.field,
                    op: quanChannel.aggregate ? quanChannel.aggregate : 'count',
                    order: 'descending'
                }
            }
        }
    }
}