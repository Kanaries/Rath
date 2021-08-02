/**
 * Lite Pipe 是2019年的老版本pipline，速度快，但结果比较模糊。近期要做更详细的评测。
 * FIXME: 评测结果。
 */
import { BehaviorSubject, combineLatest, from } from 'rxjs';
import * as op from 'rxjs/operators';
import { BIField, Field, OperatorType } from '../global';
import { IFieldMeta, IRow } from '../interfaces';
import { clusterMeasures, combineFieldsService, FieldSummary, getFieldsSummaryService, getGroupFieldsService } from '../service';

const dataSource$ = new BehaviorSubject<IRow[]>([]);
const fields$ = new BehaviorSubject<BIField[]>([]);

function createBIFieldSet (fields: BIField[]) {
    const dimSet: Set<string> = new Set();
    const meaSet: Set<string> = new Set();
    for (let i = 0; i < fields.length; i++) {
        if (fields[i].type === 'dimension') {
            dimSet.add(fields[i].name);
        } else {
            meaSet.add(fields[i].name)
        }
    }
    return { dimSet, meaSet }
}

// FUTURE: 字段数多时可以优化
function mergeFields (originFields: BIField[], transedFields: Field[]): BIField[] {
    return originFields.map(oF => {
        let nF = transedFields.find(tF => tF.name === oF.name + '(group)')
        return {
            name: nF ? nF.name : oF.name,
            // 保留用户定义的BI Type
            type: oF.type
        }
    });
}

function generateFieldMetaList(fields: BIField[], summary: FieldSummary[]): IFieldMeta[] {
    const metas: IFieldMeta[] = [];
    for (let i = 0; i < fields.length; i++) {
        const meta: IFieldMeta = {
            fid: fields[i].name,
            features: { entropy: Infinity, maxEntropy: Infinity },
            semanticType: 'nominal',
            analyticType: fields[i].type,
            distribution: []
        }
        let matchIndex = -1;
        // index相同的数组，快速合并
        if (fields[i].name === summary[i].fieldName) {
            matchIndex = i;
        } else {
            matchIndex = summary.findIndex(s => s.fieldName === fields[i].name)
        }
        if (matchIndex > -1) {
            meta.features.entropy = summary[matchIndex].entropy;
            meta.features.maxEntropy = summary[matchIndex].entropy;
            meta.semanticType = summary[matchIndex].type;
            meta.distribution = summary[matchIndex].distribution;
            metas.push(meta);
        }
    }
    return metas;
}

const univar$ = combineLatest([dataSource$, fields$]).pipe(
    op.map(([dataSource, fields]) => {
        const fieldIds = fields.map(f => f.name);
        const { dimSet, meaSet } = createBIFieldSet(fields);
        return from(getFieldsSummaryService(dataSource, fieldIds, false)).pipe(
            // field with semantic type info
            op.map(summary => ({
                originMetas: generateFieldMetaList(fields, summary),
                originSummary: summary,
                semanticFields: summary
                    .filter(f => dimSet.has(f.fieldName))
                    .map(f => ({ name: f.fieldName, type: f.type }))
                })
            ),
            op.map(({ semanticFields, originMetas, originSummary }) => from(getGroupFieldsService(dataSource, semanticFields, false)).pipe(
                op.map(({ groupedData, newFields })  => {
                    const mergedFields = mergeFields(fields, newFields);
                    return from(getFieldsSummaryService(groupedData, newFields, false)).pipe(
                        op.map(groupedSummary => {
                            const transedMetas = generateFieldMetaList(mergedFields, [...groupedSummary, ...originSummary]);
                            return {
                                transedData: groupedData,
                                transedMetas,
                                originMetas
                            }
                        })
                    )
                }),
                op.switchAll(),
            )),
            op.switchAll()
        )
    }),
    op.switchAll(),
    op.share()
)

const aggOperator$: BehaviorSubject<OperatorType> = new BehaviorSubject('sum' as OperatorType);

const cookedDataset$ = univar$.pipe(
    // op.withLatestFrom(dataSource$, fields$, aggOperator$),
    op.map((univarResult) => {
        const { transedData, transedMetas, originMetas } = univarResult;
        const orderedDimMetas = transedMetas.filter(m => m.analyticType === 'dimension');
        const orderedMeaMetas = transedMetas.filter(m => m.analyticType === 'measure');
        orderedDimMetas.sort((a, b) => a.features.entropy - b.features.entropy);
        
        return {
            ...univarResult,
            dimMetas: orderedDimMetas,
            meaMetas: orderedMeaMetas
        }
    }),
    op.share(),
)

const TOP_K_DIM_PERCENT$ = new BehaviorSubject(0.7);
const MAX_MEA_GROUP_NUM$ = new BehaviorSubject(3);

const dataSubspaces$ = cookedDataset$.pipe(
    op.withLatestFrom(aggOperator$, TOP_K_DIM_PERCENT$),
    op.map(([cookedDataset, operator, TOP_K_DIM_PERCENT]) => {
        const { dimMetas, meaMetas, transedData, transedMetas } = cookedDataset
        const selectedDimIds = dimMetas.slice(0, dimMetas.length * TOP_K_DIM_PERCENT)
            .map(dim => dim.fid);
        const meaIds = meaMetas.map(m => m.fid);
        // TODO: 工程想法，这种转化的目的是为了降低传输的数据量。但是这种逻辑和设计不应该是算法层关心的，而是服务层关心的。
        // 所以算法层赢尽可能减少这类转化（也会方便后续做优化）。
        return from(combineFieldsService(transedData, selectedDimIds, meaIds, operator, false))
    })
    ,
    op.switchAll(),
    op.share()
)

const viewSpaces$ = dataSubspaces$.pipe(
    op.withLatestFrom(MAX_MEA_GROUP_NUM$),
    op.map(([subspaceList, MAX_MEA_GROUP_NUM]) => {
        // TODO: 同上，减少算法层的格式转化
        const combinedSpaces = subspaceList.map(space => {
            return {
              dimensions: space.dimensions,
              measures: space.measures,
              matrix: space.correlationMatrix
            };
        });
        return from(clusterMeasures(MAX_MEA_GROUP_NUM, combinedSpaces, false))
    })
)