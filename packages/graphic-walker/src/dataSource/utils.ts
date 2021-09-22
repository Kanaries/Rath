import { Record, IField, IMutField } from '../interfaces';
import { Insight } from 'visual-insights';

export function transData(dataSource: Record[]): {
    dataSource: Record[];
    fields: IMutField[]
} {
    if (dataSource.length === 0) return {
        dataSource: [],
        fields: []
    };
    let ans: Record[] = [];
    const keys = Object.keys(dataSource[0]);
    // TODO: 冗余设计，单变量统计被进行了多次重复计算。另外对于这种不完整的分析任务，不建议使用VIEngine。
    const vie = new Insight.VIEngine();
    vie.setData(dataSource)
        .setFields(keys.map(k => ({
            key: k,
            analyticType: '?',
            dataType: '?',
            semanticType: '?'
        })))
    // TODO: 结合上面的TODO，讨论，VIEngine是否要提供不需要进行univarSelection就提供summary的接口。
    // 这里我们使用了一种非原API设计时期待的用法，即强制指定单变量选择时要全选字段。但我们无法阻止对变量的转换。
    vie.univarSelection('percent', 1);
    const fields = vie.fields;
    // console.log(fields)
    for (let record of dataSource) {
        const newRecord: Record = {};
        for (let field of fields) {
            if (field.dataType === 'number' || field.dataType === 'integer') {
                newRecord[field.key] = Number(record[field.key])
            } else {
                newRecord[field.key] = record[field.key]
            }
        }
        ans.push(newRecord);
    }
    return {
        dataSource: ans,
        fields: fields.map(f => ({
            key: f.key,
            analyticType: f.analyticType,
            dataType: f.dataType,
            semanticType: f.semanticType
        }))
    }
}