import { IFieldSummary } from "../interfaces";
import { FieldType, Record } from "../../../commonTypes";

export interface IFieldSummaryInVis extends IFieldSummary {
    impurity: number;
}
interface LabelField extends IFieldSummaryInVis {
    choosen: boolean;
}
interface VisualElements {
  position: number;
  color: number;
  size: number;
  shape: number;
  opacity: number;
  facets: number;
  page: number;
  filter: number;
  highFacets: number
}

export interface ISpec {
    position?: string[];
    color?: string[];
    size?: string[];
    shape?: string[];
    opacity?: string[];
    facets?: string[];
    page?: string[];
    filter?: string[];
    highFacets?: string[];
    geomType?: string[];
}

const geomTypes = {
    interval: [0, 10],
    line: [11, Infinity],
    area: [11, Infinity],
    point: [0, 1000],
    path: [0, 100],
    density: [1001, Infinity],
};

function getVisualElements (): VisualElements {
  return {
    position: 2,
    color: 1,
    size: 1,
    shape: 1,
    opacity: 1,
    facets: 2,
    page: 1,
    filter: 1,
    highFacets: 1000
  }
}

function findBestField(type: FieldType, fieldRankList: LabelField[]): LabelField | false {
    for (let i = fieldRankList.length - 1; i >= 0; i--) {
        if (fieldRankList[i].semanticType === type && !fieldRankList[i].choosen) {
            return fieldRankList[i];
        }
    }
    return false;
}

export function encoding(fields: IFieldSummaryInVis[]): ISpec {
    let spec: ISpec = {};
    let visualElements = getVisualElements();
    let fieldRankList = fields.map((field) => {
        return {
            ...field,
            choosen: false,
        };
    });
    const priority: [FieldType, string[]][] = [
        ["quantitative", ["position", "size", "color", "highFacets", "opacity", "page", "filter"]],
        ["temporal", ["position", "page", "filter"]],
        ["ordinal", ["position", "color", "opacity", "facets", "size", "page", "filter", "highFacets"]],
        ["nominal", ["position", "color", "facets", "shape", "page", "filter", "hightFacets"]],
    ];
    let fieldLeft = fieldRankList.length;
    for (let typeIndex = 0; typeIndex < priority.length && fieldLeft > 0; typeIndex++) {
        let type = priority[typeIndex][0];
        let channelList = priority[typeIndex][1];

        for (let i = 0; i < channelList.length && fieldLeft > 0; i++) {
            let channel = channelList[i];

            let field: LabelField | false;
            while (visualElements[channel] > 0 && (field = findBestField(type, fieldRankList))) {
                if (typeof spec[channel] === "undefined") {
                    spec[channel] = [];
                }
                spec[channel].push(field.key);
                visualElements[channel]--;
                fieldLeft--;
                field.choosen = true;
            }
        }
    }
    return spec;
}


export function specification(fields: IFieldSummaryInVis[], dataView: Record[]) {
    let rankedFields: IFieldSummaryInVis[] = fields.sort((a, b) => a.impurity - b.impurity);
    let spec = encoding(rankedFields);
    const dimensions: Set<string> = new Set(fields.filter(f => f.analyticType === 'dimension').map(f => f.key))
    const measures: Set<string> = new Set(fields.filter(f => f.analyticType === 'measure').map(f => f.key))
    // todo: design a better rule for choosing geom type.
    if (spec.position && spec.position.length === 2) {
        if (
            (dimensions.has(spec.position[0]) && measures.has(spec.position[1])) ||
            (dimensions.has(spec.position[1]) && measures.has(spec.position[0]))
        ) {
            const dimIndex = dimensions.has(spec.position[0]) ? 0 : 1;
            const dim = spec.position[dimIndex];
            const mea = spec.position[(dimIndex + 1) % 2];
            spec.position = [dim, mea];
            const originDimField = fields.find((f) => f.key === dim);
            const dimCardinality = originDimField ? originDimField.domain.size : 0;
            spec.geomType = ["interval", "line", "area"].filter((geom) => {
                return dimCardinality >= geomTypes[geom][0] && dimCardinality <= geomTypes[geom][1];
            });
            if (originDimField.semanticType === 'nominal') {
                spec.geomType = ["interval"];
            }
        } else {
            // ['point', 'path', 'heatmap']
            spec.geomType = ["point", "density"].filter((geom) => {
                return dataView.length >= geomTypes[geom][0] && dataView.length <= geomTypes[geom][1];
            });
        }
    }
    return { schema: spec, dataView };
}