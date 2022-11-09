import { Slider, Toggle } from "@fluentui/react";
import produce from "immer";
import { observer } from "mobx-react-lite";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import useErrorBoundary from "../../../hooks/use-error-boundary";
import type { IFieldMeta, IRow } from "../../../interfaces";
import { useGlobalStore } from "../../../store";
import type { ModifiableBgKnowledge } from "../config";
import ExplorerMainView from "./explorerMainView";
import FlowAnalyzer, { NodeWithScore } from "./flowAnalyzer";


export type CausalNode = {
    nodeId: number;
}

export type CausalLink = {
    causeId: number;
    effectId: number;
    score: number;
    type: 'directed' | 'bidirected' | 'undirected' | 'weak directed';
}

export interface DiagramGraphData {
    readonly nodes: readonly Readonly<CausalNode>[];
    readonly links: readonly Readonly<CausalLink>[];
}

export interface ExplorerProps {
    dataSource: IRow[];
    fields: readonly Readonly<IFieldMeta>[];
    scoreMatrix: readonly (readonly number[])[];
    preconditions: ModifiableBgKnowledge[];
    onNodeSelected: (
        node: Readonly<IFieldMeta> | null,
        simpleCause: readonly Readonly<NodeWithScore>[],
        simpleEffect: readonly Readonly<NodeWithScore>[],
        composedCause: readonly Readonly<NodeWithScore>[],
        composedEffect: readonly Readonly<NodeWithScore>[],
    ) => void;
    onLinkTogether: (srcIdx: number, tarIdx: number) => void;
    onRemoveLink: (srcFid: string, tarFid: string) => void;
}

const sNormalize = (matrix: readonly (readonly number[])[]): number[][] => {
    return matrix.map(vec => vec.map(n => 2 / (1 + Math.exp(-n)) - 1));
};

const Container = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
`;

const Tools = styled.div`
    width: 100%;
    flex-grow: 0;
    flex-shrink: 0;
    display: flex;
    flex-direction: row;
    border: 1px solid #e3e2e2;
    margin: 8px 0px 0px 0px;
    padding: 8px 1em;
    align-items: center;
    > *:not(button) {
        height: 100%;
        flex-grow: 1;
        flex-shrink: 1;
        margin-block: 0;
        :not(:last-child) {
            margin-inline-end: 1em;
        }
    }
    > button {
        margin-right: 2em;
    }
`;

const MainView = styled.div`
    width: 100%;
    flex-grow: 0;
    flex-shrink: 0;
    /* height: 46vh; */
    overflow: hidden;
    display: flex;
    flex-direction: row;
    align-items: stretch;
    justify-content: stretch;
    border: 1px solid #e3e2e2;
    margin: 8px 0px;
    /* padding: 1em; */
    > * {
        height: 100%;
        flex-grow: 1;
        flex-shrink: 1;
    }
`;

const Explorer: FC<ExplorerProps> = ({ dataSource, fields, scoreMatrix, onNodeSelected, onLinkTogether, onRemoveLink, preconditions }) => {
    const { causalStore } = useGlobalStore();
    const { causalAlgorithm, causalStrength } = causalStore;

    const [cutThreshold, setCutThreshold] = useState(0);
    const [mode, setMode] = useState<'explore' | 'edit'>('explore');
    
    const data = useMemo(() => sNormalize(scoreMatrix), [scoreMatrix]);

    const [modifiedMatrix, setModifiedMatrix] = useState(data);

    useEffect(() => {
        setModifiedMatrix(data);
    }, [data]);

    const nodes = useMemo<CausalNode[]>(() => {
        return fields.map((_, i) => ({ nodeId: i }));
    }, [fields]);

    const links = useMemo<CausalLink[]>(() => {
        if (causalStrength.length === 0) {
            return [];
        }
        if (causalStrength.length !== modifiedMatrix.length) {
            console.warn(`lengths of matrixes do not match`);
            return [];
        }

        const links: CausalLink[] = [];

        /* eslint no-fallthrough: ["error", { "allowEmptyCase": true }] */
        switch (causalAlgorithm) {
            case 'CD_NOD':
            case 'PC': {
                // cg.G.graph[j,i]=1 and cg.G.graph[i,j]=-1 indicate i –> j;
                // cg.G.graph[i,j] = cg.G.graph[j,i] = -1 indicate i — j;
                // cg.G.graph[i,j] = cg.G.graph[j,i] = 1 indicates i <-> j.
                for (let i = 0; i < modifiedMatrix.length - 1; i += 1) {
                    for (let j = i + 1; j < modifiedMatrix.length; j += 1) {
                        const weight = modifiedMatrix[i][j];
                        const forwardFlag = causalStrength[i][j];
                        const backwardFlag = causalStrength[j][i];
                        if (backwardFlag === 1 && forwardFlag === -1) {
                            links.push({
                                causeId: i,
                                effectId: j,
                                score: Math.abs(weight),
                                type: 'directed',
                            });
                        } else if (forwardFlag === 1 && backwardFlag === -1) {
                            links.push({
                                causeId: j,
                                effectId: i,
                                score: Math.abs(weight),
                                type: 'directed',
                            });
                        } else if (forwardFlag === -1 && backwardFlag === -1) {
                            links.push({
                                causeId: i,
                                effectId: j,
                                score: Math.abs(weight),
                                type: 'undirected',
                            });
                        } else if (forwardFlag === 1 && backwardFlag === 1) {
                            links.push({
                                causeId: i,
                                effectId: j,
                                score: Math.abs(weight),
                                type: 'bidirected',
                            });
                        }
                    }
                }
                break;
            }
            case 'FCI': {
                // G.graph[j,i]=1 and G.graph[i,j]=-1 indicates i –> j;
                // G.graph[i,j] = G.graph[j,i] = -1 indicates i — j;
                // G.graph[i,j] = G.graph[j,i] = 1 indicates i <-> j;
                // G.graph[j,i]=1 and G.graph[i,j]=2 indicates i o-> j.
                for (let i = 0; i < modifiedMatrix.length - 1; i += 1) {
                    for (let j = i + 1; j < modifiedMatrix.length; j += 1) {
                        const weight = modifiedMatrix[i][j];
                        const forwardFlag = causalStrength[i][j];
                        const backwardFlag = causalStrength[j][i];
                        if (backwardFlag === 1 && forwardFlag === -1) {
                            links.push({
                                causeId: i,
                                effectId: j,
                                score: Math.abs(weight),
                                type: 'directed',
                            });
                        } else if (forwardFlag === 1 && backwardFlag === -1) {
                            links.push({
                                causeId: j,
                                effectId: i,
                                score: Math.abs(weight),
                                type: 'directed',
                            });
                        } else if (forwardFlag === -1 && backwardFlag === -1) {
                            links.push({
                                causeId: i,
                                effectId: j,
                                score: Math.abs(weight),
                                type: 'undirected',
                            });
                        } else if (forwardFlag === 1 && backwardFlag === 1) {
                            links.push({
                                causeId: i,
                                effectId: j,
                                score: Math.abs(weight),
                                type: 'bidirected',
                            });
                        } else if (forwardFlag === 1 && backwardFlag === 2) {
                            links.push({
                                causeId: i,
                                effectId: j,
                                score: Math.abs(weight),
                                type: 'weak directed',
                            });
                        }
                    }
                }
                break;
            }
            case 'GES': {
                // Record[‘G’].graph[j,i]=1 and Record[‘G’].graph[i,j]=-1 indicate i –> j;
                // Record[‘G’].graph[i,j] = Record[‘G’].graph[j,i] = -1 indicates i — j.
                for (let i = 0; i < modifiedMatrix.length - 1; i += 1) {
                    for (let j = i + 1; j < modifiedMatrix.length; j += 1) {
                        const weight = modifiedMatrix[i][j];
                        const forwardFlag = causalStrength[i][j];
                        const backwardFlag = causalStrength[j][i];
                        if (backwardFlag === 1 && forwardFlag === -1) {
                            links.push({
                                causeId: i,
                                effectId: j,
                                score: Math.abs(weight),
                                type: 'directed',
                            });
                        } else if (forwardFlag === 1 && backwardFlag === -1) {
                            links.push({
                                causeId: j,
                                effectId: i,
                                score: Math.abs(weight),
                                type: 'directed',
                            });
                        } else if (forwardFlag === -1 && backwardFlag === -1) {
                            links.push({
                                causeId: i,
                                effectId: j,
                                score: Math.abs(weight),
                                type: 'undirected',
                            });
                        }
                    }
                }
                break;
            }
            case 'ExactSearch': {
                // Estimated DAG.
                for (let i = 0; i < modifiedMatrix.length; i += 1) {
                    for (let j = 0; j < modifiedMatrix.length; j += 1) {
                        if (i === j) {
                            continue;
                        }
                        const weight = modifiedMatrix[i][j];
                        const linked = causalStrength[i][j] === 1;
                        if (linked) {
                            links.push({
                                causeId: i,
                                effectId: j,
                                score: Math.abs(weight),
                                type: 'directed',
                            });
                        }
                    }
                }
                break;
            }
            default: {
                console.warn(`Unknown algo: ${causalAlgorithm}`);
                break;
            }
        }

        return links.sort((a, b) => Math.abs(b.score) - Math.abs(a.score));
    }, [modifiedMatrix, causalAlgorithm, causalStrength]);

    const value = useMemo(() => ({ nodes, links }), [nodes, links]);

    const handleChange = useCallback((d: Readonly<DiagramGraphData>) => {
        const matrix = data.map(vec => vec.map(d => d));
        for (const link of d.links) {
            matrix[link.causeId][link.effectId] = link.score;
            matrix[link.effectId][link.causeId] = -link.score;
        }
        setModifiedMatrix(matrix);
    }, [data]);

    // console.log(fields, links);
    const [focus, setFocus] = useState(-1);

    const handleClickCircle = useCallback((node: Readonly<CausalNode>) => {
        const idx = node.nodeId;
        if (mode === 'explore') {
            setFocus(idx === focus ? -1 : idx);
        } else {
            if (focus === -1) {
                setFocus(idx);
            } else if (idx === focus) {
                setFocus(-1);
            } else {
                // link
                handleChange(produce(value, draft => {
                    const idxMe = draft.links.findIndex(
                        link => link.causeId === focus && link.effectId === idx
                    );
                    if (idxMe !== -1) {
                        draft.links[idxMe].score = 1;
                    } else {
                        draft.links.push({
                            causeId: focus,
                            effectId: idx,
                            score: 1,
                            type: 'directed',
                        });
                    }
                    const idxRev = draft.links.findIndex(
                        link => link.effectId === focus && link.causeId === idx
                    );
                    if (idxRev !== -1) {
                        draft.links[idxRev].score = -1;
                    }
                    setFocus(-1);
                }));
                onLinkTogether(focus, idx);
            }
        }
    }, [mode, focus, handleChange, value, onLinkTogether]);

    const ErrorBoundary = useErrorBoundary((err, info) => {
        // console.error(err ?? info);
        return (
            <div
                style={{
                    flexGrow: 0,
                    flexShrink: 0,
                    width: '100%',
                    padding: '1em 2.5em',
                    border: '1px solid #e3e2e2',
                }}
            >
                <p>
                    {"Failed to visualize flows as DAG. Click a different node or turn up the link filter."}
                </p>
                <small>{err?.message ?? info}</small>
            </div>
        );
    }, [fields, value, mode === 'explore' ? focus : -1, cutThreshold]);

    const handleLink = useCallback((srcFid: string, tarFid: string) => {
        if (srcFid === tarFid) {
            return;
        }
        onLinkTogether(fields.findIndex(f => f.fid === srcFid), fields.findIndex(f => f.fid === tarFid));
    }, [fields, onLinkTogether]);

    return (
        <Container onClick={() => focus !== -1 && setFocus(-1)}>
            <Tools onClick={e => e.stopPropagation()}>
                {/* <DefaultButton onClick={() => setModifiedMatrix(data)}>
                    Reset
                </DefaultButton> */}
                <Toggle
                    // label="Modify Constraints"
                    label="编辑约束"
                    checked={mode === 'edit'}
                    onChange={(_, checked) => setMode(checked ? 'edit' : 'explore')}
                    onText="On"
                    offText="Off"
                    inlineLabel
                />
                <Slider
                    label="按权重筛选"
                    min={0}
                    max={1}
                    step={0.01}
                    value={cutThreshold}
                    showValue
                    onChange={d => setCutThreshold(d)}
                    styles={{
                        root: {
                            flexGrow: 1,
                            flexShrink: 1,
                        },
                    }}
                />
            </Tools>
            <MainView>
                <ExplorerMainView
                    fields={fields}
                    value={value}
                    preconditions={preconditions}
                    focus={focus === -1 ? null : focus}
                    mode={mode}
                    cutThreshold={cutThreshold}
                    onClickNode={handleClickCircle}
                    onLinkTogether={handleLink}
                    onRemoveLink={onRemoveLink}
                    style={{
                        width: '100%',
                        height: '100%',
                    }}
                />
            </MainView>
            <ErrorBoundary>
                <FlowAnalyzer
                    dataSource={dataSource}
                    fields={fields}
                    data={value}
                    index={mode === 'explore' ? focus : -1}
                    cutThreshold={cutThreshold}
                    onClickNode={handleClickCircle}
                    onUpdate={onNodeSelected}
                />
            </ErrorBoundary>
        </Container>
    );
};


export default observer(Explorer);
