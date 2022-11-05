import { Slider, Toggle } from "@fluentui/react";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import useErrorBoundary from "../../../hooks/use-error-boundary";
import type { IFieldMeta } from "../../../interfaces";
import ExplorerMainView from "./explorerMainView";
import FlowAnalyzer from "./flowAnalyzer";


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
}

const sNormalize = (matrix: ExplorerProps['compareMatrix']): number[][] => {
    return matrix.map(vec => vec.map(n => 2 / (1 + Math.exp(-n)) - 1));
};

const Container = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    box-shadow: 0 1.6px 3.6px 0 rgb(0 0 0 / 8%), 0 0.3px 0.9px 0 rgb(0 0 0 / 5%),
            inset 0 4.8px 10.8px 0 rgb(0 0 0 / 6%), 0 1.6px 5.4px 0 rgb(0 0 0 / 4%);
    margin-block: 4em;
    border: 1px solid transparent;
    padding-block: 1.6em;
    padding-inline: 2em;
`;

const Tools = styled.div`
    width: 100%;
    flex-grow: 0;
    flex-shrink: 0;
    display: flex;
    flex-direction: row;
    box-shadow: 0 1.6px 3.6px 0 rgb(0 0 0 / 8%), 0 0.3px 0.9px 0 rgb(0 0 0 / 5%),
            inset 0 4.8px 10.8px 0 rgb(0 0 0 / 2%), 0 1.6px 5.4px 0 rgb(0 0 0 / 1%);
    margin-block: 1em;
    border: 1px solid transparent;
    padding-block: 1.8em;
    padding-inline: 2em;
    align-items: center;
    > * {
        height: 100%;
        flex-grow: 1;
        flex-shrink: 1;
        margin-block: 0;
        :not(:last-child) {
            margin-inline-end: 1em;
        }
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
    box-shadow: 0 1.6px 3.6px 0 rgb(0 0 0 / 8%), 0 0.3px 0.9px 0 rgb(0 0 0 / 5%),
            inset 0 4.8px 10.8px 0 rgb(0 0 0 / 2%), 0 1.6px 5.4px 0 rgb(0 0 0 / 1%);
    margin-block: 1em;
    border: 1px solid transparent;
    padding-block: 1.8em;
    padding-inline: 2em;
    > * {
        height: 100%;
        flex-grow: 1;
        flex-shrink: 1;
        /* margin-block: 0; */
    }
`;

const Explorer: FC<ExplorerProps> = ({ fields, compareMatrix }) => {
    const [cutThreshold, setCutThreshold] = useState(0.2);
    const [mode, setMode] = useState<'explore' | 'edit'>('explore');
    
    const data = useMemo(() => sNormalize(compareMatrix), [compareMatrix]);

    const [modifiedMatrix, setModifiedMatrix] = useState(data);

    useEffect(() => {
        setModifiedMatrix(data)
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

    const handleFocusChange = useCallback((idx: number) => setFocus(idx), []);

    const ErrorBoundary = useErrorBoundary((err, info) => {
        console.error(err ?? info);
        return <p>{info}</p>;
    }, [fields, value, handleChange, mode, cutThreshold, handleFocusChange]);

    const DetailErrorBoundary = useErrorBoundary((err, info) => {
        console.error(err ?? info);
        return <p>{info}</p>;
    }, [fields, value, focus, cutThreshold]);

    return (
        <Container>
            <Tools>
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
                <ErrorBoundary>
                    <ExplorerMainView
                        fields={fields}
                        value={value}
                        onChange={handleChange}
                        mode={mode}
                        cutThreshold={cutThreshold}
                        onFocusChange={handleFocusChange}
                        style={{
                            width: 'unset',
                            height: '100%',
                        }}
                    />
                </ErrorBoundary>
            </MainView>
            {focus !== -1 && (
                <DetailErrorBoundary>
                    <FlowAnalyzer
                        fields={fields}
                        data={value}
                        index={focus}
                        cutThreshold={cutThreshold}
                    />
                </DetailErrorBoundary>
            )}
        </Container>
    );
};


export default Explorer;
