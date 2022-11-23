import { Toggle } from "@fluentui/react";
import { observer } from "mobx-react-lite";
import { FC, useEffect, useState } from "react";
import styled from "styled-components";
import type { IFieldMeta, IRow } from "../../../interfaces";
import { useGlobalStore } from "../../../store";
import type { IRInsightExplainResult } from "../../../workers/insight/r-insight.worker";
import DiffChart from "./diffChart";
import ExplainChart from "./explainChart";


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
        width: 200px;
        overflow: hidden auto;
        border-right: 1px solid #8884;
        & *[role=tab] {
            user-select: none;
            cursor: pointer;
            display: flex;
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
            & small {
                margin: 0 0.5em;
                padding: 0.12em 0.5em;
                border-radius: 0.1em;
                background-color: #8882;
            }
        }
    }
    & *[role=tabpanel] {
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
                                checked={normalize}
                                onChange={(_, checked) => setNormalize(Boolean(checked))}
                            />
                            <br />
                            <ExplainChart
                                data={data}
                                mainField={mainField}
                                mainFieldAggregation={mainFieldAggregation}
                                indexKey={dimension}
                                interactive={false}
                                normalize={normalize}
                            />
                            <DiffChart
                                data={data}
                                subspaces={indices}
                                mainField={mainField}
                                mainFieldAggregation={mainFieldAggregation}
                                dimension={dimension}
                                mode={mode}
                            />
                            <p>
                                {`选择区间内 ${dimension.name ||
                                    dimension.fid
                                } 与 ${mainField.name || mainField.fid} 表现出影响。评分：${view.responsibility}。`}
                            </p>
                        </>
                    )}
                </div>
            </Container>
        </>
    );
};


export default observer(RInsightView);
