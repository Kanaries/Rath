import { Slider } from "@fluentui/react";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import type { IFieldMeta } from "../../../interfaces";
import DiagramGraphEditor from "./diagramGraphEditor";
import ErrorBoundary from "./errorBoundary";
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

const Explorer: FC<ExplorerProps> = ({ fields, compareMatrix }) => {
    const [cutThreshold, setCutThreshold] = useState(0.2);
    
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

    return (
        <div>
            <Slider
                label="Cutting Threshold"
                min={0}
                max={1}
                step={0.01}
                value={cutThreshold}
                showValue
                onChange={d => setCutThreshold(d)}
            />
            <ErrorBoundary>
                <DiagramGraphEditor
                    fields={fields}
                    value={value}
                    onChange={handleChange}
                    cutThreshold={cutThreshold}
                    onFocusChange={handleFocusChange}
                    style={{
                        width: '100%',
                        height: '300px',
                    }}
                />
            </ErrorBoundary>
            {focus !== -1 && (
                <ErrorBoundary>
                    <FlowAnalyzer
                        fields={fields}
                        data={value}
                        index={focus}
                        cutThreshold={cutThreshold}
                    />
                </ErrorBoundary>
            )}
        </div>
    );
};


export default Explorer;
