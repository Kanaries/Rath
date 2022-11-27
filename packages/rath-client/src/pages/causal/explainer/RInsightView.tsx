import intl from 'react-intl-universal';
import { ActionButton, Toggle } from "@fluentui/react";
import { observer } from "mobx-react-lite";
import { FC, Fragment, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import type { IFieldMeta, IRow } from "../../../interfaces";
import { useGlobalStore } from "../../../store";
import type { IRInsightExplainResult, IRInsightExplainSubspace } from "../../../workers/insight/r-insight.worker";
import { RInsightService } from '../../../services/r-insight';
import type { IFunctionalDep, PagLink } from '../config';
import type { useDataViews } from '../hooks/dataViews';
import DiffChart from "./diffChart";
import ExplainChart from "./explainChart";
import VisText, { IVisTextProps } from './visText';


export interface IRInsightViewProps {
    data: IRow[];
    result: IRInsightExplainResult;
    mainField: IFieldMeta;
    mainFieldAggregation: "sum" | "mean" | "count" | null;
    entryDimension: IFieldMeta | null;
    mode: "full" | "other" | "two-group";
    indices: [number[], number[]];
    subspaces: [IRInsightExplainSubspace, IRInsightExplainSubspace];
    context: ReturnType<typeof useDataViews>;
    functionalDependencies: IFunctionalDep[];
    edges: PagLink[];
    aggr: "sum" | "mean" | "count" | null;
    serviceMode: "worker" | "server";
}

const Container = styled.div`
    display: flex;
    flex-direction: row;
    border: 1px solid #8884;
    height: 500px;
    overflow: hidden;
    & *[role=tablist] {
        padding: 0;
        width: 280px;
        flex-grow: 0;
        flex-shrink: 0;
        overflow: hidden auto;
        border-right: 1px solid #8884;
        & *[role=tab] {
            user-select: none;
            cursor: pointer;
            display: flex;
            align-items: baseline;
            overflow: hidden;
            flex-wrap: wrap;
            padding: 0.5em 1em;
            :hover {
                background-color: #8881;
            }
            > * {
                flex-grow: 0;
                flex-shrink: 1;
            }
            &[aria-selected=true] {
                cursor: default;
                font-weight: bolder;
                :hover {
                    background-color: unset;
                }
            }
            & .title {
                font-size: 80%;
                margin: 0 0.5em 0 0;
                padding: 0.12em 0.5em;
                border-radius: 0.1em;
                background-color: #8882;
            }
            & small {
                margin: 0 0.5em;
                color: orange;
            }
        }
    }
    & *[role=tabpanel] {
        flex-grow: 1;
        flex-shrink: 1;
        overflow: auto;
        padding: 1em;
    }
    > p {
        margin: 1em;
    }
`;

const ExploreQueue = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    border: 1px solid #8884;
    border-bottom: none;
    height: 2.6em;
    line-height: 1.8em;
    padding: 0.4em 1em;
    overflow: auto hidden;
    > * {
        flex-grow: 0;
        flex-shrink: 0;
    }
    > span {
        user-select: none;
        color: #8888;
    }
`;

const RInsightView: FC<IRInsightViewProps> = ({
    data, result, mainField, mainFieldAggregation, entryDimension,
    mode, indices, subspaces, context, functionalDependencies, edges,
    aggr, serviceMode,
}) => {
    const { dataSourceStore, causalStore } = useGlobalStore();
    const { fieldMetas } = dataSourceStore;
    const { selectedFields } = causalStore;
    const [normalize, setNormalize] = useState<boolean>(true);
    const [cursor, setCursor] = useState(0);
    const { sample } = context;

    const [localIrResult, setLocalIrResult] = useState<{
        addedMeasure: string;
        result: IRInsightExplainResult;
    }[]>([]);

    useEffect(() => {
        setLocalIrResult([]);
    }, [result]);

    const list = (localIrResult.at(-1)?.result ?? result).causalEffects;

    useEffect(() => {
        setCursor(0);
    }, [list]);

    const view = list[cursor];
    const dimension = view ? fieldMetas.find(f => f.fid === view.src) : null;

    const pendingRef = useRef<Promise<IRInsightExplainResult>>();

    const calculate = (measure: string) => {
        const [current, other] = subspaces;
        if (!current) {
            return;
        }
        const p = new Promise<IRInsightExplainResult>(resolve => {
            const fieldsInSight = new Set(
                current.predicates.map(pdc => pdc.fid).concat(localIrResult.map(step => step.addedMeasure)).concat(
                    [mainField.fid, measure]
                )
            );
            RInsightService({
                data: sample,
                fields: selectedFields,
                causalModel: {
                    funcDeps: functionalDependencies,
                    edges,
                },
                groups: {
                    current,
                    other,
                },
                view: {
                    dimensions: [...fieldsInSight],
                    measures: [measure].map(fid => ({
                        fid: fid,
                        op: aggr,
                    })),
                },
            }, serviceMode).then(resolve);
        });
        pendingRef.current = p;
        p.then(res => {
            if (pendingRef.current === p) {
                setLocalIrResult(list => list.concat([{
                    addedMeasure: measure,
                    result: {
                        causalEffects: res.causalEffects.filter(
                            item => Number.isFinite(item.responsibility)// && item.responsibility !== 0
                        ).sort((a, b) => b.responsibility - a.responsibility),
                    }
                }]));
            }
        }).finally(() => {
            pendingRef.current = undefined;
        });
    };

    const visTextContext: IVisTextProps['context'] = {
        fields: fieldMetas,
        onClickField: fid => {
            calculate(fid);
        },
    };

    const latestEntry = fieldMetas.find(f => f.fid === localIrResult.at(-1)?.addedMeasure);

    return (
        <>
            <header>Why Query</header>
            <ExploreQueue>
                <ActionButton
                    iconProps={{ iconName: 'BranchCommit' }}
                    style={{ pointerEvents: 'none' }}
                >
                    {mainField.name || mainField.fid}
                </ActionButton>
                <span>{'/'}</span>
                <ActionButton
                    iconProps={{ iconName: 'BranchMerge' }}
                    onClick={() => localIrResult.length === 0 || setLocalIrResult([])}
                    style={localIrResult.length === 0 ? { pointerEvents: 'none', fontWeight: 600 } : undefined}
                >
                    {entryDimension ? entryDimension.name || entryDimension.fid : '-'}
                </ActionButton>
                {localIrResult.map((step, i, arr) => {
                    const measure = fieldMetas.find(f => f.fid === step.addedMeasure);
                    const isCurrent = i === arr.length - 1;
                    return (
                        <Fragment key={i}>
                            <span>{'>'}</span>
                            <ActionButton
                                iconProps={{ iconName: 'BranchMerge' }}
                                onClick={() => isCurrent || setLocalIrResult(localIrResult.slice(0, i + 1))}
                                style={isCurrent ? { pointerEvents: 'none', fontWeight: 600 } : undefined}
                            >
                                {measure?.name || step.addedMeasure}
                            </ActionButton>
                        </Fragment>
                    );
                })}
            </ExploreQueue>
            <Container>
                {list.length === 0 ? (
                    <p>没有更多的线索</p>
                ) : (
                    <>
                        <div role="tablist">
                            {list.map((res, i) => {
                                const dim = fieldMetas.find(f => f.fid === res.src);

                                return dim && (
                                    <div key={dim.fid} onClick={() => setCursor(i)} role="tab" aria-selected={i === cursor}>
                                        {res.description?.title && (
                                            <span className="title">
                                                {intl.get(`RInsight.explanation.title.${res.description.title}`)}
                                            </span>
                                        )}
                                        <span>
                                            {dim.name || dim.fid}
                                        </span>
                                        <small>
                                            {Math.abs(res.responsibility).toPrecision(2)}
                                        </small>
                                    </div>
                                );
                            })}
                        </div>
                        <div role="tabpanel">
                            {dimension && (
                                <>
                                    <Toggle
                                        label="Normalize Stack"
                                        inlineLabel
                                        checked={normalize}
                                        onChange={(_, checked) => setNormalize(Boolean(checked))}
                                    />
                                    <br />
                                    <ExplainChart
                                        title="全局分布"
                                        data={data}
                                        mainField={mainField}
                                        mainFieldAggregation={mainFieldAggregation}
                                        indexKey={dimension}
                                        interactive={false}
                                        normalize={normalize}
                                    />
                                    <DiffChart
                                        title="对比分布"
                                        data={data}
                                        subspaces={indices}
                                        mainField={mainField}
                                        mainFieldAggregation={mainFieldAggregation}
                                        dimension={dimension}
                                        mode={mode}
                                    />
                                    {view.description && (
                                        <VisText context={visTextContext}>
                                            {`${
                                                latestEntry ? `结合 field.noEvents(${
                                                    latestEntry.name || latestEntry.fid
                                                }) 的分布下，` : ''
                                            }${intl.get(`RInsight.explanation.desc.${view.description.key}`, {
                                                ...view.description.data,
                                                responsibility: view.responsibility,
                                                mainField: mainField.fid,
                                                dimension: dimension.fid,
                                            })}`}
                                        </VisText>
                                    )}
                                </>
                            )}
                        </div>
                    </>
                )}
            </Container>
        </>
    );
};


export default observer(RInsightView);
