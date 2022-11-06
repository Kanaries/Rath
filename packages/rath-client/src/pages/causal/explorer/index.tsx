import { DefaultButton, Slider, Toggle } from "@fluentui/react";
import produce from "immer";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import useErrorBoundary from "../../../hooks/use-error-boundary";
import type { IFieldMeta } from "../../../interfaces";
import ExplorerMainView from "./explorerMainView";
import FlowAnalyzer, { NodeWithScore } from "./flowAnalyzer";


export type CausalNode = {
    nodeId: number;
}

export type CausalLink = {
    causeId: number;
    effectId: number;
    score: number;
}

export interface DiagramGraphData {
    readonly nodes: readonly Readonly<CausalNode>[];
    readonly links: readonly Readonly<CausalLink>[];
}

export interface ExplorerProps {
    fields: readonly Readonly<IFieldMeta>[];
    compareMatrix: readonly (readonly number[])[];
    onNodeSelected: (
        node: Readonly<IFieldMeta> | null,
        simpleCause: readonly Readonly<NodeWithScore>[],
        simpleEffect: readonly Readonly<NodeWithScore>[],
        composedCause: readonly Readonly<NodeWithScore>[],
        composedEffect: readonly Readonly<NodeWithScore>[],
    ) => void;
}

const sNormalize = (matrix: ExplorerProps['compareMatrix']): number[][] => {
    return matrix.map(vec => vec.map(n => 2 / (1 + Math.exp(-n)) - 1));
};

const Container = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    margin-block: 4em;
    border: 1px solid #8888;
    padding-block: 1.6em;
    padding-inline: 2em;
`;

const Tools = styled.div`
    width: 100%;
    flex-grow: 0;
    flex-shrink: 0;
    display: flex;
    flex-direction: row;
    border: 1px solid #8888;
    margin-block: 1em;
    padding-block: 1.8em;
    padding-inline: 2em;
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
    height: 40vh;
    display: flex;
    flex-direction: row;
    align-items: stretch;
    justify-content: stretch;
    border: 1px solid #8888;
    margin-block: 1em;
    padding-block: 1.8em;
    padding-inline: 2em;
    > * {
        height: 100%;
        flex-grow: 1;
        flex-shrink: 1;
    }
`;

const Explorer: FC<ExplorerProps> = ({ fields, compareMatrix, onNodeSelected }) => {
    const [cutThreshold, setCutThreshold] = useState(0.05);
    const [mode, setMode] = useState<'explore' | 'edit'>('explore');
    
    const data = useMemo(() => sNormalize(compareMatrix), [compareMatrix]);

    const [modifiedMatrix, setModifiedMatrix] = useState(data);

    useEffect(() => {
        setModifiedMatrix(data);
    }, [data]);

    const nodes = useMemo<CausalNode[]>(() => {
        return fields.map((_, i) => ({
            nodeId: i,
        }));
    }, [fields]);

    const links = useMemo<CausalLink[]>(() => {
        const links: CausalLink[] = [];

        for (let i = 0; i < modifiedMatrix.length - 1; i += 1) {
            for (let j = i + 1; j < modifiedMatrix.length; j += 1) {
                const weight = modifiedMatrix[i][j];
                if (weight > 0) {
                    links.push({
                        causeId: i,
                        effectId: j,
                        score: weight,
                    });
                } else if (weight < 0) {
                    links.push({
                        causeId: j,
                        effectId: i,
                        score: - weight,
                    });
                }
            }
        }

        return links.sort((a, b) => Math.abs(b.score) - Math.abs(a.score));
    }, [modifiedMatrix]);

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
            }
        }
    }, [mode, focus, handleChange, value]);

    const ErrorBoundary = useErrorBoundary((err, info) => {
        console.error(err ?? info);
        return <div style={{
            flexGrow: 0,
            flexShrink: 0,
            display: 'flex',
            width: '100%',
            height: '30vh',
            border: '1px solid #8888',
        }} />;
        // return <p>{info}</p>;
    }, [fields, value, mode === 'explore' ? focus : -1, cutThreshold]);

    return (
        <Container onClick={() => focus !== -1 && setFocus(-1)}>
            <Tools onClick={e => e.stopPropagation()}>
                <DefaultButton onClick={() => setModifiedMatrix(data)}>
                    Reset
                </DefaultButton>
                <Toggle
                    label="Enable Edit"
                    checked={mode === 'edit'}
                    onChange={(_, checked) => setMode(checked ? 'edit' : 'explore')}
                    onText="On"
                    offText="Off"
                />
                <Slider
                    label="Link Filter"
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
                    focus={focus === -1 ? null : focus}
                    mode={mode}
                    cutThreshold={cutThreshold}
                    onClickNode={handleClickCircle}
                    style={{
                        width: 'unset',
                        height: '100%',
                    }}
                />
            </MainView>
            <ErrorBoundary>
                <FlowAnalyzer
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


export default Explorer;
