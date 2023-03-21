import {
    NextVICore,
    IPattern,
    IFilter,
    applyFilters,
    mic,
    getTemporalFreqRange,
    generalMic,
    pureGeneralMic,
    inverseGeneralMic,
    nnMic,
} from '@kanaries/loa';
import { IFieldMeta, IRow } from '../../interfaces';

function getFieldRelation(data: IRow[], xField: IFieldMeta, yField: IFieldMeta) {
    let score = 0;
    const X = data.map((row) => row[xField.fid]);
    const Y = data.map((row) => row[yField.fid]);
    if (xField.semanticType === 'quantitative' && yField.semanticType === 'quantitative') {
        score = mic(X, Y);
    }
    if (xField.semanticType !== 'quantitative' && yField.semanticType === 'quantitative') {
        if (xField.semanticType === 'temporal') score = pureGeneralMic(X, Y);
        else score = generalMic(X, Y);
    }
    if (xField.semanticType === 'quantitative' && yField.semanticType !== 'quantitative') {
        if (yField.semanticType === 'temporal') score = inverseGeneralMic(X, Y, getTemporalFreqRange);
        else score = inverseGeneralMic(X, Y);
    }
    if (xField.semanticType !== 'quantitative' && yField.semanticType !== 'quantitative') {
        if (yField.semanticType === 'temporal') score = nnMic(X, Y, getTemporalFreqRange);
        // 这里如果要用hack的temporal解法的话，需要用purennmic来做T-T类型。但是我们目前并不想提升T-T类型。不如等到之后时间系统改造完用正规的方法搞。
        else score = nnMic(X, Y);
    }
    return score;
}
interface IFieldWildCard {
    fid: '*';
    neighbors: string[];
    includeNeighbors: boolean;
}
interface ILoaDataView {
    fields: (IFieldMeta | IFieldWildCard)[];
    filters: IFilter[];
}
class TestCore extends NextVICore {
    public replaceFields(dataSource: IRow[], fields: IFieldMeta[], view: ILoaDataView) {
        const viewFields = view.fields.filter((f) => f.fid !== '*') as IFieldMeta[];
        const viewWildCards = view.fields.filter((f) => f.fid === '*') as IFieldWildCard[];
        const viewData = applyFilters(dataSource, view.filters);
        const ans: IPattern[] = [];
        const nextView = {
            fields: [...viewFields],
            filters: view.filters,
        };
        // TODO: [feat] dfc for multi view wildcards
        // jojocys, last week   (November 19th, 2022 4:38 PM) 
        for (let card of viewWildCards) {
            const fieldsWithScore: { field: IFieldMeta; score1: number; score2: number }[] = [];
            for (let field of fields) {
                if (nextView.fields.find((f) => f.fid === field.fid)) continue;
                if (!card.includeNeighbors && card.neighbors.includes(field.fid)) continue;
                let newFieldCorrelation2View = 0;
                let totalScore = 0;
                for (let nei of card.neighbors) {
                    const neiField = fields.find((f) => f.fid === nei)!;
                    let cor = getFieldRelation(viewData, field, neiField);
                    newFieldCorrelation2View += cor;
                }
                if (card.neighbors.length > 0) {
                    newFieldCorrelation2View /= card.neighbors.length;
                }
                if (viewFields.length > 0) {
                    for (let viewField of viewFields) {
                        const score = getFieldRelation(viewData, field, viewField);
                        totalScore += score;
                    }
                    totalScore /= viewFields.length;
                }
                fieldsWithScore.push({
                    field: field,
                    score1: newFieldCorrelation2View,
                    score2: totalScore,
                });
            }
            fieldsWithScore.sort((a, b) => {
                let aHasSameSemanticOfCard = card.neighbors.map(nei => fields.find(f => f.fid === nei)).filter(f => Boolean(f)).every(nei => nei?.semanticType === a.field.semanticType)
                let bHasSameSemanticOfCard = card.neighbors.map(nei => fields.find(f => f.fid === nei)).filter(f => Boolean(f)).every(nei => nei?.semanticType === b.field.semanticType)
                if (aHasSameSemanticOfCard && !bHasSameSemanticOfCard) return -1;
                if (!aHasSameSemanticOfCard && bHasSameSemanticOfCard) return 1;
                let aHasSameAnalyticOfCard = card.neighbors.map(nei => fields.find(f => f.fid === nei)).filter(f => Boolean(f)).every(nei => nei?.analyticType === a.field.analyticType)
                let bHasSameAnalyticOfCard = card.neighbors.map(nei => fields.find(f => f.fid === nei)).filter(f => Boolean(f)).every(nei => nei?.analyticType === b.field.analyticType)
                if (aHasSameAnalyticOfCard && !bHasSameAnalyticOfCard) return -1;
                if (!aHasSameAnalyticOfCard && bHasSameAnalyticOfCard) return 1;
                if (b.score1 > a.score1) return 1;
                if (b.score1 < a.score1) return -1;
                if (b.score2 > a.score2) return 1;
                if (b.score2 < a.score2) return -1;
                return 0;
            });
            for (let ansField of fieldsWithScore) {
                ans.push({
                    fields: [...viewFields, ansField.field],
                    filters: nextView.filters,
                    imp: ansField.score2 * (1 + ansField.score1),
                })
            }
        }
        return ans;
    }
}

export interface ILoaProps {
    task: 'univar' | 'patterns' | 'featureSelection' | 'comparison' | 'filterSelection' | 'neighbors';
    props?: any;
    dataSource: IRow[];
    fields: IFieldMeta[];
}
export function serviceHandler(reqProps: ILoaProps) {
    const { task, props, dataSource, fields } = reqProps;
    try {
        if (task === 'univar') return univarService(dataSource, fields, props);
        if (task === 'patterns') return patternService(dataSource, fields, props);
        if (task === 'featureSelection') return featureSelection(dataSource, fields, props);
        if (task === 'comparison') return featureForComparison(dataSource, fields, props);
        if (task === 'filterSelection') return filterSelection(dataSource, fields, props);
        if (task === 'neighbors') return replaceFields(dataSource, fields, props);
    } catch (error: any) {
        throw new Error(`[loa engine][${task}]${error}\n${error.stack}`);
    }
}

function univarService(dataSource: IRow[], fields: IFieldMeta[], props: any) {
    const core = new NextVICore(dataSource, fields);
    const ans = core.searchPatterns();
    return ans;
}

function patternService(dataSource: IRow[], fields: IFieldMeta[], props: IPattern) {
    const core = new NextVICore(dataSource, fields);
    const ans = core.createHighOrderPatterns(props);
    return ans;
}

function featureSelection(dataSource: IRow[], fields: IFieldMeta[], props: IPattern) {
    const core = new NextVICore(dataSource, fields);
    const ans = core.pureFeatureRecommand(props);
    return ans;
}

function featureForComparison(dataSource: IRow[], fields: IFieldMeta[], props: [IPattern, IPattern]) {
    const core = new NextVICore(dataSource, fields);
    const ans = core.fewatureSelectionForSecondPatternWithSpecifiedViews(props[0], props[1]);
    return ans;
}

function filterSelection(dataSource: IRow[], fields: IFieldMeta[], props: IPattern) {
    const core = new NextVICore(dataSource, fields);
    const ans = core.recommandFilter(props);
    return ans;
}


function replaceFields (dataSource: IRow[], fields: IFieldMeta[], props: ILoaDataView) {
    const core = new TestCore(dataSource, fields);
    const ans = core.replaceFields(dataSource, fields, props);
    return ans;
}