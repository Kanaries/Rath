import intl from 'react-intl-universal';
import { ActionButton, Icon, Toggle, TooltipHost } from "@fluentui/react";
import { observer } from "mobx-react-lite";
import { FC, Fragment, useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { useId } from '@fluentui/react-hooks';
import type { IFieldMeta, IRow } from "../../../../interfaces";
import { useGlobalStore } from "../../../../store";
import type { IRInsightExplainResult, IRInsightExplainSubspace } from "../../../../workers/insight/r-insight.worker";
import { RInsightService } from '../../../../services/r-insight';
import DiffChart from "./diffChart";
import ExplainChart from "./explainChart";
import VisText, { IVisTextProps } from './visText';


export interface IRInsightViewProps {
    data: readonly IRow[];
    result: IRInsightExplainResult;
    mainField: IFieldMeta;
    entryDimension: IFieldMeta | null;
    mode: "full" | "other" | "two-group";
    indices: [number[], number[]];
    subspaces: [IRInsightExplainSubspace, IRInsightExplainSubspace];
    aggr: "sum" | "mean" | "count" | null;
    serviceMode: "worker" | "server";
}

const Container = styled.div`
    display: flex;
    flex-direction: row;
    border: 1px solid #8884;
    height: 500px;
    overflow: hidden;
    > p {
        margin: 1em;
    }
`;

const TabList = styled.div<{ light?: boolean }>`
    padding: 0;
    flex-grow: 1;
    flex-shrink: 1;
    overflow: hidden auto;
    border-right: ${({ light }) => light ? 'none' : '1px solid #8884'};
    > .tools {
        border-right: 1px solid #8884;
    }
    > *[role=tab] {
        user-select: none;
        cursor: pointer;
        display: flex;
        align-items: baseline;
        overflow: hidden;
        flex-wrap: wrap;
        padding: 0.5em 1em;
        border-top: ${({ light }) => light ? 'none' : '1px solid #8888'};
        background-color: #fff;
        position: relative;
        z-index: 10;
        :first-child {
            border-top: none;
        }
        :hover {
            filter: brightness(0.96);
        }
        > * {
            flex-grow: 0;
            flex-shrink: 1;
        }
        &[aria-selected=true] {
            background-color: #fffe;
            position: sticky;
            top: 0;
            bottom: 0;
            cursor: default;
            font-weight: bolder;
            :hover {
                filter: unset;
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
    > *[role=tabpanel] {
        position: relative;
        margin: 1em;
        padding: 0 1em 1em;
        z-index: 9;
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
    padding: 0.4em 0;
    overflow: auto hidden;
    position: relative;
    > * {
        flex-grow: 0;
        flex-shrink: 0;
        z-index: 1;
    }
    > span {
        user-select: none;
        color: #8888;
    }
    > div.tool {
        position: sticky;
        left: 0;
        margin-right: 1em;
        border-right: 1px solid #8882;
        padding: 0 0.24em;
        height: 100%;
        z-index: 2;
        background-color: #fffd;
    }
`;

const RInsightView: FC<IRInsightViewProps> = ({
    data, result, mainField, entryDimension,
    mode, indices, subspaces, serviceMode,
}) => {
    const { dataSourceStore, causalStore } = useGlobalStore();
    const { fieldMetas } = dataSourceStore;
    const { fields, sample } = causalStore.dataset;
    const { mergedPag, functionalDependencies } = causalStore.model;
    const [normalize, setNormalize] = useState<boolean>(true);
    const [cursor, setCursor] = useState(0);

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
                        dimensions: [...fieldsInSight],
                        measures: [measure].map(fid => ({
                            fid: fid,
                            op: null,
                        })),
                    },
                }, serviceMode).then(resolve);
            });
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

    const tabIdPrefix = useId();
    const getTabId = useCallback((cursor: number) => `${tabIdPrefix}_${cursor}`, [tabIdPrefix]);

    useEffect(() => {
        const activeTab = document.getElementById(getTabId(cursor)) as null | (HTMLDivElement & {
            scrollIntoViewIfNeeded?: HTMLDivElement['scrollIntoView'] | undefined;
        });
        activeTab?.['scrollIntoViewIfNeeded' in activeTab ? 'scrollIntoViewIfNeeded' : 'scrollIntoView']?.({
            behavior: 'smooth',
            block: 'center',
        });
    }, [cursor, list, getTabId]);

    return (
        <>
            <header style={{ margin: '1em 0' }}>{intl.get('causal.analyze.why_query')}</header>
            {/* TODO: 这里面手风琴 + TOC 的设计个人比较满意，有时间可以优化下样式然后作为组件抽出去 */}
            <ExploreQueue>
                <div className="tool">
                    <TooltipHost
                        content={(
                            <TabList role="tablist" light>
                                {list.map((res, i) => {
                                    const dim = fieldMetas.find(f => f.fid === res.src);
                                    const tar = fieldMetas.find(f => f.fid === res.tar);
        
                                    return dim && tar && (
                                        <Fragment key={dim.fid}>
                                            <div onClick={() => setCursor(i)} role="tab" aria-selected={i === cursor}>
                                                {res.description?.title && (
                                                    <span className="title">
                                                        {intl.get(`RInsight.explanation.title.${res.description.title}`)}
                                                    </span>
                                                )}
                                                <span>
                                                    {dim.name || dim.fid}
                                                </span>
                                            </div>
                                        </Fragment>
                                    );
                                })}
                            </TabList>
                        )}
                    >
                        <Icon iconName="BulletedList" style={{ color: 'rgb(16,110,190)', cursor: 'pointer', padding: '0 0.4em' }} />
                    </TooltipHost>
                </div>
                <ActionButton
                    onClick={() => localIrResult.length === 0 || setLocalIrResult([])}
                    style={localIrResult.length === 0 ? { pointerEvents: 'none', fontWeight: 600 } : undefined}
                >
                    {mainField.name || mainField.fid}
                    {entryDimension && (
                        <>
                            <Icon iconName="Link" style={{ margin: '0 0.4em' }} />
                            {`${entryDimension.name || entryDimension.fid}`}
                        </>
                    )}
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
                    <p>{intl.get('causal.analyze.no_more_hints')}</p>
                ) : (
                    <TabList role="tablist">
                        {list.map((res, i) => {
                            const dim = fieldMetas.find(f => f.fid === res.src);
                            const tar = fieldMetas.find(f => f.fid === res.tar);

                            return dim && tar && (
                                <Fragment key={dim.fid}>
                                    <div onClick={() => setCursor(i)} role="tab" aria-selected={i === cursor}>
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
                                    {i === cursor && (
                                        <div role="tabpanel" id={getTabId(i)}>
                                            <Toggle
                                                label={intl.get('causal.analyze.normalize_stack')}
                                                inlineLabel
                                                checked={normalize}
                                                onChange={(_, checked) => setNormalize(Boolean(checked))}
                                            />
                                            <br />
                                            <ExplainChart
                                                title={intl.get('causal.analyze.global_dist')}
                                                data={data}
                                                mainField={tar}
                                                mainFieldAggregation={null}
                                                indexKey={dim}
                                                interactive={false}
                                                normalize={normalize}
                                            />
                                            <DiffChart
                                                title={intl.get('causal.analyze.diff_dist')}
                                                data={data}
                                                subspaces={indices}
                                                mainField={tar}
                                                mainFieldAggregation={null}
                                                dimension={dim}
                                                mode={mode}
                                            />
                                            {view.description && (
                                                <VisText context={visTextContext}>
                                                    {intl.get(`RInsight.explanation.desc.${view.description.key}`, {
                                                        ...view.description.data,
                                                        responsibility: view.responsibility,
                                                        mainField: tar.fid,
                                                        dimension: dim.fid,
                                                    })}
                                                </VisText>
                                            )}
                                        </div>
                                    )}
                                </Fragment>
                            );
                        })}
                    </TabList>
                )}
            </Container>
        </>
    );
};


export default observer(RInsightView);
