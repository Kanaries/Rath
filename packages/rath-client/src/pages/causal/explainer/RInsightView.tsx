import intl from 'react-intl-universal';
import { Toggle } from "@fluentui/react";
import { observer } from "mobx-react-lite";
import { FC, useEffect, useState } from "react";
import styled from "styled-components";
import type { IFieldMeta, IRow } from "../../../interfaces";
import { useGlobalStore } from "../../../store";
import type { IRInsightExplainResult } from "../../../workers/insight/r-insight.worker";
import DiffChart from "./diffChart";
import ExplainChart from "./explainChart";
import VisText from './visText';


export interface IRInsightViewProps {
    data: IRow[];
    result: IRInsightExplainResult;
    mainField: IFieldMeta;
    mainFieldAggregation: "sum" | "mean" | "count" | null;
    mode: "full" | "other" | "two-group";
    indices: [number[], number[]];
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
`;

const RInsightView: FC<IRInsightViewProps> = ({ data, result, mainField, mainFieldAggregation, mode, indices }) => {
    const { dataSourceStore } = useGlobalStore();
    const { fieldMetas } = dataSourceStore;
    const [normalize, setNormalize] = useState<boolean>(true);
    const [cursor, setCursor] = useState(0);

    useEffect(() => {
        setCursor(0);
    }, [result]);

    const view = result.causalEffects[cursor];
    const dimension = view ? fieldMetas.find(f => f.fid === view.src) : null;

    return (
        <>
            <header>Why Query</header>
            <Container>
                <div role="tablist">
                    {result.causalEffects.map((res, i) => {
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
                                // @ts-ignore
                                <VisText>
                                    {intl.get(`RInsight.explanation.desc.${view.description.key}`, {
                                        ...view.description.data,
                                        responsibility: view.responsibility,
                                        mainField: mainField.name || mainField.fid,
                                        dimension: dimension.name || dimension.fid,
                                    })}
                                </VisText>
                            )}
                        </>
                    )}
                </div>
            </Container>
        </>
    );
};


export default observer(RInsightView);
