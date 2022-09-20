import { ISemanticType, Specification } from 'visual-insights';
import { IField, IRow } from '../interfaces';
import { Utils } from 'visual-insights';
import { IPredicate } from '../utils';
export type IReasonType = 'selection_dim_distribution' | 'selection_mea_distribution' | 'children_major_factor' | 'children_outlier';
export const geomTypeMap: { [key: string]: any } = {
    interval: 'bar',
    line: 'line',
    point: 'point',
    // density: 'rect'
    density: 'point',
};
export function baseVis(
    query: Specification,
    dataSource: IRow[],
    dimensions: string[],
    measures: string[],
    predicates: IPredicate[] | null,
    aggregatedMeasures: Array<{ op: string; field: string; as: string }>,
    fields: Readonly<IField[]>,
    type: IReasonType,
    defaultAggregated?: boolean,
    defaultStack?: boolean
) {
    const {
        position = [],
        color = [],
        size = [],
        facets = [],
        opacity = [],
        geomType = [],
        page = [],
    } = query;

    function adjustField(fieldName: string): string {
        if (defaultAggregated && measures.includes(fieldName)) {
            let aggField = aggregatedMeasures.find((mea) => {
                return mea.field === fieldName;
            });
            return aggField ? aggField.as : fieldName;
        }
        return fieldName;
    }

    function getFieldSemanticType(fid: string): ISemanticType {
        let targetField = fields.find((f) => f.fid === fid);
        return targetField ? targetField.semanticType : 'nominal';
    }

    function getFieldLabel (fid: string): string {
        let targetField = fields.find((f) => f.fid === fid);
        return targetField ? targetField.name : fid;
    }

    // let chartWidth = 500; //container.current ? container.current.offsetWidth * 0.8 : 600;
    const fieldMap: any = {
        x: position[0],
        y: position[1],
        color: color[0],
        size: size[0],
        opacity: opacity[0],
        row: facets[0],
        column: facets[1],
    };
    let spec: any = {
        // width: chartWidth,
        data: {
            values: dataSource,
        },
        transform: [],
    };
    let basicSpec: any = {
        // width: chartWidth,
        transform: [],
        mark: {
            type: geomType[0] && geomTypeMap[geomType[0]] ? geomTypeMap[geomType[0]] : geomType[0],
            tooltip: true,
        },
        encoding: {},
    };
    const dimInView: string[] = [];
    Object.values(query).forEach(fields => {
        fields.forEach((f: any) => {
            if (dimensions.includes(f)) dimInView.push(f);
        })
    })
    if (defaultAggregated && aggregatedMeasures.length > 0) {
        basicSpec.transform.push({
            aggregate: [],
            groupby: dimInView,
        });
    }
    const aggMap: Map<string, string> = new Map();
    for (let channel in fieldMap) {
        if (fieldMap[channel]) {
            if (getFieldSemanticType(fieldMap[channel]) === 'quantitative' && defaultAggregated) {
                const targetField = aggregatedMeasures.find((f) => f.field === fieldMap[channel]);
                if (targetField) {
                    aggMap.set(targetField.field, `${targetField.op}_of_${targetField.field}`);
                    basicSpec.transform[0].aggregate.push({
                        op: targetField.op === 'count' ? 'sum' : targetField.op,
                        field: targetField.field,
                        as: `${targetField.op}_of_${targetField.field}`,
                    });
                }
                // const targetField = aggregatedMeasures.find((f) => f.field === fieldMap[channel]);
                // basicSpec.encoding[channel].aggregate = targetField ? targetField.op : 'sum';
                // basicSpec.encoding[channel].aggregate =
                //     basicSpec.encoding[channel].aggregate === 'count'
                //         ? 'sum'
                //         : basicSpec.encoding[channel].aggregate;
            }
            const adjField = adjustField(fieldMap[channel]);
            basicSpec.encoding[channel] = {
                field: aggMap.has(adjField) ? aggMap.get(adjField) : adjField,
                type: getFieldSemanticType(fieldMap[channel]),
                title: getFieldLabel(fieldMap[channel])
            };
            if (
                ['x', 'y'].includes(channel) &&
                getFieldSemanticType(fieldMap[channel]) === 'quantitative' &&
                !defaultStack
            ) {
                basicSpec.encoding[channel].stack = null;
            }
        }
    }
    if (!defaultStack && opacity.length === 0) {
        basicSpec.encoding.opacity = { value: 0.7 };
    }
    // 真TMD小学生代码
    if (predicates === null) {
        return {
            ...spec,
            ...basicSpec,
        };
    }
    const basicSpecFilter = Utils.deepcopy(basicSpec);
    basicSpec.mark.opacity = 0.9;
    basicSpec.mark.color = '#8c8c8c';
    // basicSpecFilter.mark.color = '#f5222d';
    basicSpecFilter.mark.opacity = 0.8;
    basicSpecFilter.mark.size = 10;
    Object.values(basicSpecFilter.encoding).forEach((ch: any) => {
        if (typeof ch.title === 'string') {
            ch.title = ch.title + '(target)'
        }
    })
    if (typeof basicSpecFilter.transform === 'undefined') {
        basicSpecFilter.transform = [];
    }
    basicSpecFilter.transform = [
        ...predicates.map((pre) => {
            const filter: any = {
                filter: {
                    field: pre.key,
                },
            };
            if (pre.type === 'continuous') {
                filter.filter.range = pre.range;
            } else {
                filter.filter.oneOf = [...pre.range.values()];
            }
            return filter;
        }),
        ...basicSpecFilter.transform,
    ];
    if (type !== 'selection_mea_distribution' && color.length + size.length + opacity.length + page.length > 0) {
        spec = {
            ...spec,
            vconcat: [basicSpec, basicSpecFilter],
        };
    } else {
        if (basicSpecFilter.encoding.color) {
            basicSpecFilter.encoding.color = { value: 'grey' };
        }
        spec = {
            ...spec,
            layer: [basicSpec, basicSpecFilter],
            "resolve": {"scale": {"y": "independent"}}
        };
    }
    return spec;
}
