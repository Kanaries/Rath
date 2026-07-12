import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { applyFilters } from '@kanaries/loa';
import { RathSelect } from '../../../../components/rath-ui/rath-select';
import { Button } from '../../../../components/ui/button';
import { Label } from '../../../../components/ui/label';
import { Switch } from '../../../../components/ui/switch';
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
    const [aggr, setAggr] = useState<'sum' | 'mean' | 'count' | null>('sum');
    const [diffMode, setDiffMode] = useState<'full' | 'other' | 'two-group'>('other');

    useEffect(() => {
        setIndexKey((ik) => (ik ? fieldMetas.find((f) => f.fid === ik.fid) ?? null : null));
    }, [fieldMetas]);

    const [subspaces, setSubspaces] = useState<[IRInsightExplainSubspace, IRInsightExplainSubspace] | null>(null);

    useEffect(() => {
        setSubspaces(null);
    }, [mainField, aggr]);

    const [irResult, setIrResult] = useState<IRInsightExplainResult>({ causalEffects: [] });
    const [serviceMode, setServiceMode] = useState<'worker' | 'server'>('server');

    const pendingRef = useRef<Promise<IRInsightExplainResult> | undefined>(undefined);

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
        const p = new Promise<IRInsightExplainResult>((resolve) => {
            const fieldsInSight = new Set(current.predicates.map((pdc) => pdc.fid).concat([mainField.fid]));
            sample.getAll().then((data) => {
                RInsightService(
                    {
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
                            dimensions: [...fieldsInSight].filter((fid) => fid !== mainField.fid),
                            measures: [mainField].map((ms) => ({
                                fid: ms.fid,
                                op: aggr,
                            })),
                        },
                    },
                    serviceMode
                ).then(resolve);
            });
        });
        pendingRef.current = p;
        p.then((res) => {
            if (pendingRef.current === p) {
                setIrResult({
                    causalEffects: res.causalEffects
                        .filter(
                            (item) => Number.isFinite(item.responsibility) // && item.responsibility !== 0
                        )
                        .sort((a, b) => b.responsibility - a.responsibility),
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
        const indicesA = applyFilters(data, subspaces[0].predicates).map((row) => row[indexName]) as number[];
        const indicesB =
            diffMode === 'two-group'
                ? (applyFilters(data, subspaces[1].predicates).map((row) => row[indexName]) as number[])
                : diffMode === 'full'
                ? (data.map((row) => row[indexName]) as number[])
                : data.map((row) => row[indexName] as number).filter((index) => !indicesA.includes(index));
        return [indicesA, indicesB];
    }, [subspaces, visSample, diffMode]);

    useEffect(() => {
        setIrResult({ causalEffects: [] });
    }, [indexKey, mainField, visSample, subspaces, mergedPag]);

    const applySelection = useCallback(() => {
        if (!subspaces) {
            return setSelectedSet(visSample);
        }
        setSelectedSet(visSample.map((row, i) => ({ ...row, [SelectedFlag]: indicesA.includes(i) ? 1 : indicesB.includes(i) ? 2 : 0 })));
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
        setSubspaces((subspaces) => (subspaces ? [subspaces[0], { predicates: [] }] : null));
        setEditingGroupIdx(1);
    }, [diffMode]);

    const handleFilter = useCallback(
        (filter: IFilter | null) => {
            switch (diffMode) {
                case 'full': {
                    setSubspaces(
                        filter
                            ? [
                                  {
                                      predicates: [filter],
                                  },
                                  {
                                      predicates: [],
                                  },
                              ]
                            : null
                    );
                    break;
                }
                case 'other': {
                    setSubspaces(
                        filter
                            ? [
                                  {
                                      predicates: [filter],
                                  },
                                  {
                                      predicates: [filter],
                                      reverted: true,
                                  },
                              ]
                            : null
                    );
                    break;
                }
                case 'two-group': {
                    setSubspaces((subspaces) => {
                        const next: typeof subspaces = subspaces ? [subspaces[0], subspaces[1]] : [{ predicates: [] }, { predicates: [] }];
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
        },
        [diffMode, editingGroupIdx]
    );

    return (
        <Container>
            {mainField && (
                <>
                    <header>{intl.get('causal.analyze.main_field')}</header>
                    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end' }}>
                        <RathSelect
                            label={intl.get('causal.analyze.service')}
                            selectedKey={serviceMode}
                            options={[
                                { key: 'worker', text: 'worker' },
                                { key: 'server', text: 'server' },
                            ]}
                            onChange={(key) => {
                                setServiceMode(key as typeof serviceMode);
                            }}
                            className="w-[7em]"
                        />
                        <RathSelect
                            label={intl.get('causal.analyze.diff_mode')}
                            selectedKey={diffMode}
                            options={[
                                { key: 'other', text: intl.get('causal.analyze.other') },
                                { key: 'full', text: intl.get('causal.analyze.full') },
                                { key: 'two-group', text: intl.get('causal.analyze.diff_two') },
                            ]}
                            onChange={(key) => {
                                setDiffMode(key as typeof diffMode);
                            }}
                            className="w-[12em]"
                        />
                    </div>
                    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end' }}>
                        <RathSelect
                            label={intl.get('causal.analyze.index_key')}
                            selectedKey={indexKey?.fid ?? ''}
                            options={[{ key: '', text: intl.get('causal.analyze.not_chosen') }].concat(
                                fieldMetas.map((f) => ({
                                    key: f.fid,
                                    text: f.name ?? f.fid,
                                }))
                            )}
                            onChange={(key) => {
                                const f = key ? fieldMetas.find((which) => which.fid === key) : null;
                                setIndexKey(f ?? null);
                            }}
                            className="w-[12em]"
                        />
                        <RathSelect
                            label={intl.get('causal.analyze.aggregation_type')}
                            selectedKey={aggr}
                            options={[
                                { key: '', text: 'None' },
                                { key: 'sum', text: 'SUM' },
                                { key: 'mean', text: 'MEAN' },
                                { key: 'count', text: 'COUNT' },
                            ]}
                            onChange={(key) => {
                                setAggr((key as typeof aggr) || null);
                            }}
                            className="w-[8em]"
                        />
                    </div>
                    {diffMode === 'two-group' && (
                        <div className="flex items-center gap-2">
                            <Label htmlFor="causal-two-group-selector">{`Select ${editingGroupIdx === 2 ? 'Background' : 'Foreground'} Group`}</Label>
                            <Switch
                                id="causal-two-group-selector"
                                checked={editingGroupIdx === 2}
                                onCheckedChange={(checked) => setEditingGroupIdx(checked ? 2 : 1)}
                            />
                        </div>
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
                                title={intl.get('causal.analyze.foreground_group')}
                                data={visSample}
                                indexKey={indexKey}
                                mainField={mainField}
                                mainFieldAggregation={aggr}
                                interactive={false}
                                subspace={indicesA}
                                normalize={false}
                            />
                            <ChartItem
                                title={intl.get('causal.analyze.background_group')}
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
                    <Button disabled={!subspaces} onClick={applySelection}>
                        {intl.get('causal.analyze.insight')}
                    </Button>
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
