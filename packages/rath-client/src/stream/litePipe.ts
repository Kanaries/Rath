/**
 * Lite Pipe 是2019年的老版本pipline，速度快，但结果比较模糊。近期要做更详细的评测。
 * FIXME: 评测结果。
 */
import { BehaviorSubject, combineLatest, from, Observable, Subject } from 'rxjs';
import * as op from 'rxjs/operators';
import { BIField, Field, OperatorType } from '../global';
import { IFieldMeta, IRawField, IRow } from '../interfaces';
import { clusterMeasures, combineFieldsService, FieldSummary, getFieldsSummaryService, getGroupFieldsService, Subspace, ViewSpace } from '../service';
import { fieldSummary2fieldMeta } from '../utils/transform';
import { get_TOP_K_DIM_GROUP_NUM$ } from './autoParams';

function createAnalyticFieldSet (fields: IRawField[]) {
    const dimSet: Set<string> = new Set();
    const meaSet: Set<string> = new Set();
    for (let i = 0; i < fields.length; i++) {
        if (fields[i].analyticType === 'dimension') {
            dimSet.add(fields[i].fid);
        } else {
            meaSet.add(fields[i].fid)
        }
    }
    return { dimSet, meaSet }
}

// FUTURE: 字段数多时可以优化
// TODO: FIXME '(group)'
function mergeFields (originFields: IRawField[], transedFields: Field[]): BIField[] {
    return originFields.map(oF => {
        let nF = transedFields.find(tF => tF.name === oF.fid + '(group)')
        return {
            name: nF ? nF.name : oF.fid,
            // 保留用户定义的BI Type
            type: oF.analyticType
        }
    });
}

function generateFieldMetaList(fields: BIField[], summary: FieldSummary[]): IFieldMeta[] {
    const metas: IFieldMeta[] = [];
    for (let i = 0; i < fields.length; i++) {
        const meta: IFieldMeta = {
            fid: fields[i].name,
            features: { entropy: Infinity, maxEntropy: Infinity, unique: 0 },
            semanticType: 'nominal',
            analyticType: fields[i].type,
            distribution: [],
            geoRole: 'none'
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
            meta.features.unique = summary[matchIndex].distribution.length
            metas.push(meta);
        }
    }
    return metas;
}

// export type IDEStreams = typeof streams;

export interface ICookedDataset {
    dimMetas: IFieldMeta[];
    meaMetas: IFieldMeta[];
    transedData: IRow[];
    transedMetas: IFieldMeta[];
    originMetas: IFieldMeta[];
}

export interface IUnivarateSummary {
    transedData: IRow[];
    transedMetas: IFieldMeta[];
    originMetas: IFieldMeta[];
}
export interface IDataEventStreams {
    start$: Subject<boolean>,
    univar$: Observable<IUnivarateSummary>;
    aggOperator$: BehaviorSubject<OperatorType>;
    cookedDataset$: Observable<ICookedDataset>;
    fullDataSubspaces$: Observable<Subspace[]>;
    dataSubspaces$: Observable<Subspace[]>;
    viewSpaces$: Observable<ViewSpace[]>;
    auto_TOP_K_DIM_GROUP_NUM$: Observable<number>;
}

interface IParamStreams {
    TOP_K_DIM_PERCENT$: Observable<number>;
    TOP_K_DIM_GROUP_NUM$: Observable<number>;
    // TODO: Idea: MAX_GROUP_NUM是不是可以用MAX_IMPURITY_IN_VIEW之类的metric来替换。
    MAX_MEA_GROUP_NUM$: Observable<number>;
    auto$: Observable<boolean>;
}

export function getDataEventStreams (dataSource$: Observable<IRow[]>, fields$: Observable<IRawField[]>, params: IParamStreams): IDataEventStreams {
    const { TOP_K_DIM_GROUP_NUM$, TOP_K_DIM_PERCENT$, MAX_MEA_GROUP_NUM$, auto$ } = params;
    const start$: Subject<boolean> = new Subject();
    const univar$ = start$.pipe(
        op.withLatestFrom(dataSource$, fields$),
        op.map(([_start, dataSource, fields]) => {
            const fieldIds = fields.map(f => f.fid);
            const { dimSet } = createAnalyticFieldSet(fields);
            return from(getFieldsSummaryService(dataSource, fieldIds, false)).pipe(
                // field with semantic type info
                op.map(summary => ({
                    originMetas: fieldSummary2fieldMeta({
                        summary,
                        analyticTypes: fields.map(f => f.analyticType),
                        semanticTypes: fields.map(f => f.semanticType)
                    }).map(m => {
                        let tf = fields.find(f => f.fid === m.fid);
                        return {
                            ...m,
                            name: tf ? tf.name : m.name
                        }
                    }),
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
            const { transedMetas } = univarResult;
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
    
    const fullDataSubspaces$ = combineLatest([cookedDataset$, aggOperator$, TOP_K_DIM_PERCENT$]).pipe(
        op.map(([cookedDataset, operator, TOP_K_DIM_PERCENT]) => {
            const { dimMetas, meaMetas, transedData } = cookedDataset
            const selectedDimIds = dimMetas.slice(0, Math.round(dimMetas.length * TOP_K_DIM_PERCENT))
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

    const { auto_K$: auto_TOP_K_DIM_GROUP_NUM$, USED_TOP_K_DIM_GROUP_NUM$ } = get_TOP_K_DIM_GROUP_NUM$(TOP_K_DIM_GROUP_NUM$, auto$, fullDataSubspaces$);


    const dataSubspaces$: Observable<Subspace[]> = combineLatest([fullDataSubspaces$, USED_TOP_K_DIM_GROUP_NUM$]).pipe(
        op.map(([subspaces, USED_TOP_K_DIM_GROUP_NUM]) => {
            return subspaces.slice(0, Math.round(USED_TOP_K_DIM_GROUP_NUM))
        }),
        op.share()
    )

    const viewSpaces$ = combineLatest([dataSubspaces$, MAX_MEA_GROUP_NUM$]).pipe(
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
        }),
        op.switchAll(),
        op.share()
    )
    return {
        start$,
        univar$,
        cookedDataset$,
        aggOperator$,
        fullDataSubspaces$,
        dataSubspaces$,
        // fields$,
        auto_TOP_K_DIM_GROUP_NUM$,
        viewSpaces$
    }
}