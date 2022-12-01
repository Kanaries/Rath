import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import { DefaultButton, Dropdown, Stack, Toggle } from '@fluentui/react';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { applyFilters } from '@kanaries/loa';
import { useGlobalStore } from '../../../../store';
import { useCausalViewContext } from '../../../../store/causalStore/viewStore';
import { IFieldMeta, IFilter, IRow } from '../../../../interfaces';
import type { IRInsightExplainResult, IRInsightExplainSubspace } from '../../../../workers/insight/r-insight.worker';
import { RInsightService } from '../../../../services/r-insight';
import ChartItem from './explainChart';
import RInsightView from './RInsightView';


const Container = styled.div``;

export const SelectedFlag = '__RExplainer_selected__';

const RExplainer: FC = () => {
    const { dataSourceStore, causalStore } = useGlobalStore();
    const { fieldMetas } = dataSourceStore;
    const viewContext = useCausalViewContext();
    const { selectedFieldGroup = [] } = viewContext ?? {};
    const { fields, sample, visSample } = causalStore.dataset;
    const { mergedPag, functionalDependencies } = causalStore.model;

    const mainField = selectedFieldGroup.at(-1) ?? null;
    const [indexKey, setIndexKey] = useState<IFieldMeta | null>(null);
    const [aggr, setAggr] = useState<"sum" | "mean" | "count" | null>('sum');
    const [diffMode, setDiffMode] = useState<"full" | "other" | "two-group">("other");

    useEffect(() => {
        setIndexKey(ik => ik ? fieldMetas.find(f => f.fid === ik.fid) ?? null : null);
    }, [fieldMetas]);

    const [subspaces, setSubspaces] = useState<[IRInsightExplainSubspace, IRInsightExplainSubspace] | null>(null);

    useEffect(() => {
        setSubspaces(null);
    }, [mainField, aggr]);

    const [irResult, setIrResult] = useState<IRInsightExplainResult>({ causalEffects: [] });
    const [serviceMode, setServiceMode] = useState<'worker' | 'server'>('server');

    const pendingRef = useRef<Promise<IRInsightExplainResult>>();

    const calculate = useCallback(() => {
        viewContext?.clearLocalWeights();
        if (!subspaces || !mainField) {
            setIrResult({ causalEffects: [] });
            return;
        }
        const [current, other] = subspaces;
        if (!current) {
            setIrResult({ causalEffects: [] });
            return;
        }
        const p = new Promise<IRInsightExplainResult>(resolve => {
            const fieldsInSight = new Set(current.predicates.map(pdc => pdc.fid).concat([mainField.fid]));
            sample.getAll().then(data => {
                RInsightService({
                    data,
                    fields,
                    causalModel: {
                        funcDeps: functionalDependencies,
                        edges: mergedPag,
                    },
                    groups: {
                        current,
                        other,
                    },
                    view: {
                        dimensions: [...fieldsInSight].filter(fid => fid !== mainField.fid),
                        measures: [mainField].map(ms => ({
                            fid: ms.fid,
                            op: aggr,
                        })),
                    },
                }, serviceMode).then(resolve);
            });
        });
        pendingRef.current = p;
        p.then(res => {
            if (pendingRef.current === p) {
                setIrResult({
                    causalEffects: res.causalEffects.filter(
                        item => Number.isFinite(item.responsibility)// && item.responsibility !== 0
                    ).sort((a, b) => b.responsibility - a.responsibility)
                });
                viewContext?.setLocalWeights(res);
            }
        }).finally(() => {
            pendingRef.current = undefined;
        });
    }, [aggr, mainField, sample, fields, subspaces, mergedPag, serviceMode, functionalDependencies, viewContext]);

    const [selectedSet, setSelectedSet] = useState<readonly IRow[]>([]);

    const [indicesA, indicesB] = useMemo<[number[], number[]]>(() => {
        if (!subspaces) {
            return [[], []];
        }
        const indexName = '__this_is_the_index_of_the_row__';
        const data = visSample.map((row, i) => ({ ...row, [indexName]: i }));
        const indicesA = applyFilters(data, subspaces[0].predicates).map(row => row[indexName]) as number[];
        // console.log('indices');
        // console.log(indicesA.join(','));
        const indicesB = diffMode === 'two-group'
            ? applyFilters(data, subspaces[1].predicates).map(row => row[indexName]) as number[]
            : diffMode === 'full' ? data.map(row => row[indexName]) as number[] : data.map(row => row[indexName] as number).filter(
                index => !indicesA.includes(index)
            );
        return [indicesA, indicesB];
    }, [subspaces, visSample, diffMode]);

    useEffect(() => {
        setIrResult({ causalEffects: [] });
    }, [indexKey, mainField, visSample, subspaces, mergedPag]);

    const applySelection = useCallback(() => {
        if (!subspaces) {
            return setSelectedSet(visSample);
        }
        setSelectedSet(
            visSample.map((row, i) => ({ ...row, [SelectedFlag]: indicesA.includes(i) ? 1 : indicesB.includes(i) ? 2 : 0 }))
        );
        calculate();
    }, [subspaces, visSample, indicesA, indicesB, calculate]);

    useEffect(() => {
        if (!subspaces) {
            setSelectedSet(visSample);
            return;
        }
    }, [subspaces, visSample]);

    const [editingGroupIdx, setEditingGroupIdx] = useState<1 | 2>(1);

    useEffect(() => {
        setSubspaces(subspaces => subspaces ? [subspaces[0], { predicates: [] }] : null);
        setEditingGroupIdx(1);
    }, [diffMode]);

    const handleFilter = useCallback((filter: IFilter | null) => {
        switch (diffMode) {
            case 'full': {
                setSubspaces(filter ? [{
                    predicates: [filter],
                }, {
                    predicates: [],
                }] : null);
                break;
            }
            case 'other': {
                setSubspaces(filter ? [{
                    predicates: [filter],
                }, {
                    predicates: [filter],
                    reverted: true,
                }] : null);
                break;
            }
            case 'two-group': {
                setSubspaces(subspaces => {
                    const next: typeof subspaces = subspaces ? [
                        subspaces[0], subspaces[1]
                    ] : [{ predicates: [] }, { predicates: [] }];
                    next[editingGroupIdx - 1] = {
                        predicates: filter ? [filter] : [],
                    };
                    return next;
                });
                break;
            }
            default: {
                break;
            }
        }
    }, [diffMode, editingGroupIdx]);

    // console.log({ irResult });

    return (
        <Container>
            {mainField && (
                <>
                    <header>{'探索目标' || 'Main Field'}</header>
                    <Stack tokens={{ childrenGap: 20 }} horizontal style={{ alignItems: 'flex-end' }}>
                        <Dropdown
                            label="运行环境"//"Service"
                            selectedKey={serviceMode}
                            options={[
                                { key: 'worker', text: 'worker' },
                                { key: 'server', text: 'server' },
                            ]}
                            onChange={(_, option) => {
                                if (option?.key) {
                                    setServiceMode(option.key as typeof serviceMode);
                                }
                            }}
                            style={{ width: '7em' }}
                        />
                        <Dropdown
                            label="对照选择"//"Diff Mode"
                            selectedKey={diffMode}
                            options={[
                                { key: 'other', text: '数据补集' || 'Other' },
                                { key: 'full', text: '数据全集' || 'Full' },
                                { key: 'two-group', text: '自选两个集合' || 'Two Groups' },
                            ]}
                            onChange={(_, option) => {
                                if (option?.key) {
                                    setDiffMode(option.key as typeof diffMode);
                                }
                            }}
                            style={{ width: '12em' }}
                        />
                    </Stack>
                    <Stack tokens={{ childrenGap: 20 }} horizontal style={{ alignItems: 'flex-end' }}>
                        <Dropdown
                            label="基准因素"//"Index Key"
                            selectedKey={indexKey?.fid ?? ''}
                            options={[{ key: '', text: '无' || 'null' }].concat(fieldMetas.map(f => ({
                                key: f.fid,
                                text: f.name ?? f.fid,
                            })))}
                            onChange={(_, option) => {
                                const f = option?.key ? fieldMetas.find(which => which.fid === option.key) : null;
                                setIndexKey(f ?? null);
                            }}
                            style={{ width: '12em' }}
                        />
                        <Dropdown
                            label="聚合类型"//"Aggregation Type"
                            selectedKey={aggr}
                            options={[
                                { key: '', text: '无（明细）' || 'None' },
                                { key: 'sum', text: '总和' || 'SUM' },
                                { key: 'mean', text: '均值' || 'MEAN' },
                                { key: 'count', text: '计数' || 'COUNT' },
                            ]}
                            onChange={(_, option) => {
                                setAggr((option?.key as typeof aggr) ?? null);
                            }}
                            style={{ width: '8em' }}
                        />
                    </Stack>
                    {diffMode === 'two-group' && (
                        <Toggle
                            label={`Select ${editingGroupIdx === 2 ? 'Background' : 'Foreground'} Group`}
                            checked={editingGroupIdx === 2}
                            onChange={(_, checked) => setEditingGroupIdx(checked ? 2 : 1)}
                        />
                    )}
                    <br />
                    <ChartItem
                        data={visSample}
                        indexKey={indexKey}
                        mainField={mainField}
                        mainFieldAggregation={aggr}
                        interactive
                        handleFilter={handleFilter}
                        normalize={false}
                    />
                    <br />
                    {subspaces && (
                        <>
                            <ChartItem
                                title="对照组"//"Foreground Group"
                                data={visSample}
                                indexKey={indexKey}
                                mainField={mainField}
                                mainFieldAggregation={aggr}
                                interactive={false}
                                subspace={indicesA}
                                normalize={false}
                            />
                            <ChartItem
                                title="实验组"//"Background Group"
                                data={visSample}
                                indexKey={indexKey}
                                mainField={mainField}
                                mainFieldAggregation={aggr}
                                interactive={false}
                                subspace={indicesB}
                                normalize={false}
                            />
                        </>
                    )}
                    <br />
                    <DefaultButton
                        disabled={!subspaces}
                        onClick={applySelection}
                    >
                        {'发现' || 'Insight'}
                    </DefaultButton>
                    {subspaces && (
                        <RInsightView
                            data={selectedSet}
                            result={irResult}
                            mainField={mainField}
                            entryDimension={indexKey}
                            mode={diffMode}
                            subspaces={subspaces}
                            indices={[indicesA, indicesB]}
                            aggr={aggr}
                            serviceMode={serviceMode}
                        />
                    )}
                </>
            )}
        </Container>
    );
};

export default observer(RExplainer);
