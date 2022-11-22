import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import { Dropdown } from '@fluentui/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGlobalStore } from '../../../store';
import type { useInteractFieldGroups } from '../hooks/interactFieldGroup';
import type { useDataViews } from '../hooks/dataViews';
import type { IFieldMeta, IFilter } from '../../../interfaces';
import type { IRInsightExplainResult, IRInsightExplainSubspace } from '../../../workers/insight/r-insight.worker';
import { applyFilters } from '../../../workers/engine/filter';
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
    const [aggr, setAggr] = useState<"sum" | "mean" | "count" | null>('sum');
    const [diffMode, setDiffMode] = useState<"full" | "other" | "two-group">("full");

    useEffect(() => {
        setIndexKey(fieldMetas.find(f => f.semanticType === 'temporal') ?? null);
    }, [fieldMetas]);

    const [subspaces, setSubspaces] = useState<[IRInsightExplainSubspace, IRInsightExplainSubspace] | null>(null);

    useEffect(() => {
        setSubspaces(null);
    }, [mainField]);

    const [irResult, setIrResult] = useState<IRInsightExplainResult['causalEffects']>([]);
    const [serviceMode, setServiceMode] = useState<'worker' | 'server'>('server');

    const pendingRef = useRef<Promise<IRInsightExplainResult>>();
    useEffect(() => {
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
                    dimensions: selectedFields.reduce<string[]>((list, f) => {
                        if (fieldsInSight.has(f.fid)) {
                            return list;
                        }
                        return list.concat([f.fid]);
                    }, []),
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
                setIrResult(res.causalEffects);
            }
        }).finally(() => {
            pendingRef.current = undefined;
        });
    }, [aggr, mainField, sample, selectedFields, subspaces, edges, serviceMode]);

    const selectedSet = useMemo(() => {
        if (!subspaces) {
            return sample;
        }
        const indexName = '__01234_admin_root_pas_null__';
        const data = sample.map((row, i) => ({ ...row, [indexName]: i }));
        const indicesA = applyFilters(data, new Map(), subspaces[0].predicates).map(row => row[indexName]) as number[];
        const indicesB = diffMode === 'two-group'
            ? applyFilters(data, new Map(), subspaces[1].predicates).map(row => row[indexName]) as number[]
            : [];
        return sample.map((row, i) => ({ ...row, [SelectedFlag]: indicesB.includes(i) ? 2 : indicesA.includes(i) ? 1 : 0 }));
    }, [subspaces, sample, diffMode]);

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
                console.error('not implemented');
                break;
            }
        }
    }, [diffMode]);

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
                    {indexKey && (
                        <ChartItem
                            data={sample}
                            indexKey={indexKey}
                            mainField={mainField}
                            mainFieldAggregation={aggr}
                            interactive
                            handleFilter={handleFilter}
                        />
                    )}
                    <header>Why Query</header>
                    {indexKey && irResult.length > 0 && (
                        irResult.map(res => (
                            <div key={res.src}>
                                <ChartItem
                                    data={selectedSet}
                                    mainField={mainField}
                                    mainFieldAggregation={aggr}
                                    indexKey={res.src}
                                    interactive={false}
                                />
                                <DiffChart
                                    data={selectedSet}
                                    mainField={mainField}
                                    mainFieldAggregation={aggr}
                                    mode={diffMode}
                                />
                                <p>
                                    {`选择区间内 ${res.src} 与 ${mainField.name || mainField.fid} 表现出影响。评分：${res.responsibility}。`}
                                </p>
                            </div>
                        ))
                    )}
                    {/* {indexKey && pccResults.length > 0 && selectedSet && (
                        pccResults.map(res => (
                            <div key={res.fields[1].fid}>
                                <ChartItem
                                    data={selectedSet}
                                    mainField={mainField}
                                    mainFieldAggregation={aggr}
                                    indexKey={res.fields[1]}
                                    interactive={false}
                                />
                                <DiffChart
                                    data={selectedSet}
                                    mainField={mainField}
                                    mainFieldAggregation={aggr}
                                    indexKey={res.fields[1]}
                                    mode={diffMode}
                                />
                                <p>
                                    {`选择区间内 ${mainField.name || mainField.fid} 与 ${res.fields[1].name || res.fields[1].fid} 表现出相关性。PCC score: ${res.score}`}
                                </p>
                            </div>
                        ))
                    )} */}
                </>
            )}
        </Container>
    );
};

export default observer(RExplainer);
