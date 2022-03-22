import { IPattern, NextVICore } from "../../dev";
import { IFieldMeta, IRow } from "../../interfaces";

export interface IFootmanProps {
    task: 'univar' | 'patterns' | 'featureSelection' | 'comparison' | 'filterSelection';
    props?: any;
    dataSource: IRow[];
    fields: IFieldMeta[];
}
export function serviceHandler(reqProps: IFootmanProps) {
    const { task, props, dataSource, fields } = reqProps
    try {
        if (task === 'univar') return univarService(dataSource, fields, props);
        if (task === 'patterns') return patternService(dataSource, fields, props);
        if (task === 'featureSelection') return featureSelection(dataSource, fields, props);
        if (task === 'comparison') return featureForComparison(dataSource, fields, props);
        if (task === 'filterSelection') return filterSelection(dataSource, fields, props);
    } catch (error: any) {
        throw new Error(`[footman][${task}]${error}\n${error.stack}`)   
    }
}

function univarService(dataSource: IRow[], fields: IFieldMeta[], props: any) {
    const core = new NextVICore(dataSource, fields);
    const ans = core.searchPatterns();
    return ans;
}

function patternService (dataSource: IRow[], fields: IFieldMeta[], props: IPattern) {
    const core = new NextVICore(dataSource, fields);
    core.firstPattern();
    const ans = core.createHighOrderPatterns(props.fields);
    return ans
}

function featureSelection (dataSource: IRow[], fields: IFieldMeta[], props: IPattern) {
    const core = new NextVICore(dataSource, fields);
    const ans = core.pureFeatureRecommand(props);
    return ans;
}

function featureForComparison (dataSouce: IRow[], fields: IFieldMeta[], props: [IPattern, IPattern]) {
    const core = new NextVICore(dataSouce, fields);
    const ans = core.fewatureSelectionForSecondPatternWithSpecifiedViews(props[0].fields.slice(0, 2) as [IFieldMeta, IFieldMeta], props[1].fields.slice(0, 2) as [IFieldMeta, IFieldMeta])
    return ans;
}

function filterSelection (dataSource: IRow[], fields: IFieldMeta[], props: IPattern) {
    const core = new NextVICore(dataSource, fields);
    const ans = core.recommandFilter(props);
    return ans;
}