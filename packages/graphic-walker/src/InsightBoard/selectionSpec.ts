import { Specification } from 'visual-insights';
import { Record, SemanticType } from '../interfaces';
export const geomTypeMap: { [key: string]: any } = {
    interval: 'bar',
    line: 'line',
    point: 'point',
    // density: 'rect'
    density: 'point',
};
export function selectionVis(
    query: Specification,
    dataSource: Record[],
    dimensions: string[],
    measures: string[],
    aggregatedMeasures: Array<{ op: string; field: string; as: string }>,
    fieldFeatures: Array<{ name: string; type: SemanticType }>,
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

    function getFieldType(field: string): SemanticType {
        let targetField = fieldFeatures.find((f) => f.name === field);
        return targetField ? targetField.type : 'nominal';
    }

    let chartWidth = 500; //container.current ? container.current.offsetWidth * 0.8 : 600;
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
        width: chartWidth,
        data: {
            values: dataSource,
        },
    };
    let basicSpec: any = {
        width: chartWidth,
        mark: {
            type: geomType[0] && geomTypeMap[geomType[0]] ? geomTypeMap[geomType[0]] : geomType[0],
            tooltip: true,
        },
        encoding: {},
    };
    for (let channel in fieldMap) {
        if (fieldMap[channel]) {
            basicSpec.encoding[channel] = {
                field: adjustField(fieldMap[channel]),
                type: getFieldType(fieldMap[channel]),
            };
            if (
                ['x', 'y'].includes(channel) &&
                getFieldType(fieldMap[channel]) === 'quantitative' &&
                !defaultStack
            ) {
                basicSpec.encoding[channel].stack = null;
            }
        }
    }
    if (!defaultStack && opacity.length === 0) {
        basicSpec.encoding.opacity = { value: 0.7 };
    }
    if (page.length === 0) {
        spec = {
            ...spec,
            ...basicSpec,
        };
    } else if (page.length > 0) {
        basicSpec.transform = [
            { filter: { selection: 'brush' } },
            defaultAggregated
                ? {
                      aggregate: aggregatedMeasures,
                      groupby: dimensions.filter((dim) => dim !== page[0]),
                  }
                : null,
        ].filter(Boolean);
        let sliderSpec = {
            width: chartWidth,
            mark: 'tick',
            selection: { brush: { encodings: ['x'], type: 'interval' } },
            encoding: {
                x: { field: page[0], type: getFieldType(page[0]) },
            },
        };
        spec.vconcat = [basicSpec, sliderSpec];
    }
    return spec;
}
