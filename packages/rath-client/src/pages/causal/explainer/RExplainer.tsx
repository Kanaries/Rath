import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import { DefaultButton, Dropdown, Toggle } from '@fluentui/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { applyFilters } from '@kanaries/loa';
import { useGlobalStore } from '../../../store';
import type { useInteractFieldGroups } from '../hooks/interactFieldGroup';
import type { useDataViews } from '../hooks/dataViews';
import { IFieldMeta, IFilter, IRow } from '../../../interfaces';
import type { IRInsightExplainResult, IRInsightExplainSubspace } from '../../../workers/insight/r-insight.worker';
import { RInsightService } from '../../../services/r-insight';
import type { PagLink } from '../config';
import ChartItem from './explainChart';
import DiffChart from './diffChart';


const Container = styled.div``;

export interface RExplainerProps {
    context: ReturnType<typeof useDataViews>;
    interactFieldGroups: ReturnType<typeof useInteractFieldGroups>;
    edges: PagLink[];
}

export const SelectedFlag = '__RExplainer_selected__';

const RExplainer: React.FC<RExplainerProps> = ({ context, interactFieldGroups, edges }) => {
    const { dataSourceStore, causalStore } = useGlobalStore();
    const { fieldMetas } = dataSourceStore;
    const { fieldGroup } = interactFieldGroups;
    const { selectedFields } = causalStore;

    const { sample } = context;

    const mainField = fieldGroup.at(-1) ?? null;
    const [indexKey, setIndexKey] = useState<IFieldMeta | null>(null);
    const [aggr, setAggr] = useState<"sum" | "mean" | "count" | null>('count');
    const [diffMode, setDiffMode] = useState<"full" | "other" | "two-group">("full");
    const [normalize, setNormalize] = useState<boolean>(true);

    useEffect(() => {
        setIndexKey(fieldMetas.find(f => f.semanticType === 'temporal') ?? null);
    }, [fieldMetas]);

    const [subspaces, setSubspaces] = useState<[IRInsightExplainSubspace, IRInsightExplainSubspace] | null>(null);

    useEffect(() => {
        setSubspaces(null);
    }, [mainField, aggr]);

    const [irResult, setIrResult] = useState<IRInsightExplainResult['causalEffects']>([]);
    const [serviceMode, setServiceMode] = useState<'worker' | 'server'>('worker');

    const pendingRef = useRef<Promise<IRInsightExplainResult>>();

    const calculate = useCallback(() => {
        if (!subspaces || !mainField) {
            setIrResult([]);
            return;
        }
        const [current, other] = subspaces;
        if (!current) {
            setIrResult([]);
            return;
        }
        const p = new Promise<IRInsightExplainResult>(resolve => {
            const fieldsInSight = new Set(current.predicates.map(pdc => pdc.fid).concat([mainField.fid]));
            RInsightService({
                data: sample,
                fields: selectedFields,
                causalModel: {
                    edges,
                },
                groups: {
                    current,
                    other,
                },
                view: {
                    dimensions: [...fieldsInSight].filter(fid => fid !== mainField.fid),
                    measures: [mainField].map(ms => ({
                        fid: ms.fid,
                        op: aggr !== 'count' ? (aggr ?? 'sum') : 'sum',
                    })),
                },
            }, serviceMode).then(resolve);
        });
        pendingRef.current = p;
        p.then(res => {
            if (pendingRef.current === p) {
                setIrResult(
                    res.causalEffects.filter(
                        item => Number.isFinite(item.responsibility) && item.responsibility !== 0
                    ).sort((a, b) => b.responsibility - a.responsibility)
                );
            }
        }).finally(() => {
            pendingRef.current = undefined;
        });
    }, [aggr, mainField, sample, selectedFields, subspaces, edges, serviceMode]);

    const [selectedSet, setSelectedSet] = useState<IRow[]>([]);

    const [indicesA, indicesB] = useMemo<[number[], number[]]>(() => {
        if (!subspaces) {
            return [[], []];
        }
        const indexName = '__this_is_the_index_of_the_row__';
        const data = sample.map((row, i) => ({ ...row, [indexName]: i }));
        const indicesA = applyFilters(data, subspaces[0].predicates).map(row => row[indexName]) as number[];
        // console.log('indices');
        // console.log(indicesA.join(','));
        const indicesB = diffMode === 'two-group'
            ? applyFilters(data, subspaces[1].predicates).map(row => row[indexName]) as number[]
            : diffMode === 'full' ? data.map(row => row[indexName]) as number[] : data.map(row => row[indexName] as number).filter(
                index => !indicesA.includes(index)
            );
        return [indicesA, indicesB];
    }, [subspaces, sample, diffMode]);

    const applySelection = useCallback(() => {
        if (!subspaces) {
            return setSelectedSet(sample);
        }
        setSelectedSet(
            sample.map((row, i) => ({ ...row, [SelectedFlag]: indicesB.includes(i) ? 2 : indicesA.includes(i) ? 1 : 0 }))
        );
        calculate();
    }, [subspaces, sample, indicesA, indicesB, calculate]);

    useEffect(() => {
        if (!subspaces) {
            setSelectedSet(sample);
            return;
        }
    }, [subspaces, sample]);

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
                    <header>Main Field</header>
                    <Dropdown
                        label="Service"
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
                    />
                    <Dropdown
                        label="Index Key"
                        selectedKey={indexKey?.fid}
                        options={fieldMetas.map(f => ({
                            key: f.fid,
                            text: f.name ?? f.fid,
                        }))}
                        onChange={(_, option) => {
                            const f = fieldMetas.find(which => which.fid === option?.key);
                            setIndexKey(f ?? null);
                        }}
                    />
                    <Dropdown
                        label="Aggregation Type"
                        selectedKey={aggr}
                        options={[
                            { key: '', text: 'None' },
                            { key: 'sum', text: 'SUM' },
                            { key: 'mean', text: 'MEAN' },
                            { key: 'count', text: 'COUNT' },
                        ]}
                        onChange={(_, option) => {
                            setAggr((option?.key as typeof aggr) ?? null);
                        }}
                    />
                    <Dropdown
                        label="Diff Mode"
                        selectedKey={diffMode}
                        options={[
                            { key: 'full', text: 'Full' },
                            { key: 'other', text: 'Other' },
                            { key: 'two-group', text: 'Two Groups' },
                        ]}
                        onChange={(_, option) => {
                            if (option?.key) {
                                setDiffMode(option.key as typeof diffMode);
                            }
                        }}
                    />
                    {diffMode === 'two-group' && (
                        <Toggle
                            label={`Select ${editingGroupIdx === 2 ? 'Background' : 'Foreground'} Group`}
                            checked={editingGroupIdx === 2}
                            onChange={(_, checked) => setEditingGroupIdx(checked ? 2 : 1)}
                        />
                    )}
                    {indexKey && (
                        <ChartItem
                            data={sample}
                            indexKey={indexKey}
                            mainField={mainField}
                            mainFieldAggregation={aggr}
                            interactive
                            handleFilter={handleFilter}
                            normalize={false}
                        />
                    )}
                    {indexKey && subspaces && (
                        <>
                            <ChartItem
                                title="Foreground Group"
                                data={sample}
                                indexKey={indexKey}
                                mainField={mainField}
                                mainFieldAggregation={aggr}
                                interactive={false}
                                subspace={indicesA}
                                normalize={false}
                            />
                            <ChartItem
                                title="Background Group"
                                data={sample}
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
                        Insight
                    </DefaultButton>
                    <header>Why Query</header>
                    <Toggle
                        label="Normalize Stack"
                        checked={normalize}
                        onChange={(_, checked) => setNormalize(Boolean(checked))}
                    />
                    {indexKey && irResult.length > 0 && (
                        irResult.map(res => {
                            const dimension = fieldMetas.find(f => f.fid === res.src);

                            return dimension && (
                                <div key={dimension.fid}>
                                    <ChartItem
                                        data={selectedSet}
                                        mainField={mainField}
                                        mainFieldAggregation={aggr}
                                        indexKey={dimension}
                                        interactive={false}
                                        normalize={normalize}
                                    />
                                    <DiffChart
                                        data={selectedSet}
                                        subspaces={[indicesA, indicesB]}
                                        mainField={mainField}
                                        mainFieldAggregation={aggr}
                                        dimension={dimension}
                                        mode={diffMode}
                                    />
                                    <p>
                                        {`选择区间内 ${
                                            dimension.name ||
                                            dimension.fid
                                        } 与 ${mainField.name || mainField.fid} 表现出影响。评分：${res.responsibility}。`}
                                    </p>
                                </div>
                            );
                        })
                    )}
                </>
            )}
        </Container>
    );
};

export default observer(RExplainer);
