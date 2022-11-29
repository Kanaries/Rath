import { DefaultButton, Icon, Slider, Toggle } from "@fluentui/react";
import { observer } from "mobx-react-lite";
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import useErrorBoundary from "../../../hooks/use-error-boundary";
import type { IFieldMeta, IRow } from "../../../interfaces";
import { useGlobalStore } from "../../../store";
import { CausalLinkDirection } from "../../../utils/resolve-causal";
import type { ModifiableBgKnowledge } from "../config";
import Floating from "../floating";
import ExplorerMainView from "./explorerMainView";
import FlowAnalyzer, { NodeWithScore } from "./flowAnalyzer";
import type { GraphNodeAttributes } from "./graph-utils";


export type CausalNode = {
    nodeId: number;
}

export type CausalLink = {
    causeId: number;
    effectId: number;
    score: number;
    type: 'directed' | 'bidirected' | 'undirected' | 'weak directed' | 'weak undirected';
}

export interface DiagramGraphData {
    readonly nodes: readonly Readonly<CausalNode>[];
    readonly links: readonly Readonly<CausalLink>[];
}

export interface ExplorerProps {
    allowEdit: boolean;
    dataSource: IRow[];
    scoreMatrix: readonly (readonly number[])[];
    preconditions: ModifiableBgKnowledge[];
    onNodeSelected: (
        node: Readonly<IFieldMeta> | null,
        simpleCause: readonly Readonly<NodeWithScore>[],
        simpleEffect: readonly Readonly<NodeWithScore>[],
        composedCause: readonly Readonly<NodeWithScore>[],
        composedEffect: readonly Readonly<NodeWithScore>[],
    ) => void;
    onLinkTogether: (srcIdx: number, tarIdx: number, type: ModifiableBgKnowledge['type']) => void;
    onRevertLink: (srcFid: string, tarFid: string) => void;
    onRemoveLink: (srcFid: string, tarFid: string) => void;
    renderNode?: (node: Readonly<IFieldMeta>) => GraphNodeAttributes | undefined;
    synchronizePredictionsUsingCausalResult: () => void;
    handleLasso?: (fields: IFieldMeta[]) => void;
}

const sNormalize = (matrix: readonly (readonly number[])[]): number[][] => {
    return matrix.map(vec => vec.map(n => 2 / (1 + Math.exp(-n)) - 1));
};

const Container = styled.div`
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: stretch;
    position: relative;
`;

const Tools = styled.div`
    width: 250px;
    flex-grow: 0;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    padding: 1em 1em;
    align-items: flex-start;
    user-select: none;
    > * {
        flex-grow: 0;
        flex-shrink: 0;
        margin: 0.3em 0;
    }
    > *:not(:first-child) {
        width: 100%;
    }
`;

const MainView = styled.div`
    flex-grow: 1;
    flex-shrink: 1;
    /* height: 46vh; */
    overflow: hidden;
    display: flex;
    flex-direction: row;
    align-items: stretch;
    justify-content: stretch;
    border: 1px solid #e3e2e2;
    /* padding: 1em; */
    > * {
        height: 100%;
        flex-grow: 1;
        flex-shrink: 1;
    }
`;

const Explorer: FC<ExplorerProps> = ({
    allowEdit,
    dataSource,
    scoreMatrix,
    onNodeSelected,
    onLinkTogether,
    onRevertLink,
    onRemoveLink,
    preconditions,
    renderNode,
    synchronizePredictionsUsingCausalResult,
    handleLasso,
}) => {
    const { causalStore } = useGlobalStore();
    const { causalStrength, selectedFields } = causalStore;

    const [cutThreshold, setCutThreshold] = useState(0);
    const [mode, setMode] = useState<'explore' | 'edit'>('explore');
    
    const [allowZoom, setAllowZoom] = useState(false);
    
    const data = useMemo(() => sNormalize(scoreMatrix), [scoreMatrix]);

    const nodes = useMemo<CausalNode[]>(() => {
        return selectedFields.map((_, i) => ({ nodeId: i }));
    }, [selectedFields]);

    const links = useMemo<CausalLink[]>(() => {
        if (causalStrength.length === 0) {
            return [];
        }
        if (causalStrength.length !== data.length) {
            console.warn(`lengths of matrixes do not match`);
            return [];
        }

        const links: CausalLink[] = [];

        for (let i = 0; i < data.length - 1; i += 1) {
            for (let j = i + 1; j < data.length; j += 1) {
                const weight = Math.abs(data[i][j]);
                const direction = causalStrength[i][j];
                switch (direction) {
                    case CausalLinkDirection.none: {
                        break;
                    }
                    case CausalLinkDirection.directed: {
                        links.push({
                            causeId: i,
                            effectId: j,
                            score: weight,
                            type: 'directed',
                        });
                        break;
                    }
                    case CausalLinkDirection.reversed: {
                        links.push({
                            causeId: j,
                            effectId: i,
                            score: weight,
                            type: 'directed',
                        });
                        break;
                    }
                    case CausalLinkDirection.weakDirected: {
                        links.push({
                            causeId: i,
                            effectId: j,
                            score: weight,
                            type: 'weak directed',
                        });
                        break;
                    }
                    case CausalLinkDirection.weakReversed: {
                        links.push({
                            causeId: j,
                            effectId: i,
                            score: weight,
                            type: 'weak directed',
                        });
                        break;
                    }
                    case CausalLinkDirection.undirected: {
                        links.push({
                            causeId: i,
                            effectId: j,
                            score: weight,
                            type: 'undirected',
                        });
                        break;
                    }
                    case CausalLinkDirection.weakUndirected: {
                        links.push({
                            causeId: i,
                            effectId: j,
                            score: weight,
                            type: 'weak undirected',
                        });
                        break;
                    }
                    case CausalLinkDirection.bidirected: {
                        links.push({
                            causeId: i,
                            effectId: j,
                            score: weight,
                            type: 'bidirected',
                        });
                        break;
                    }
                    default: {
                        break;
                    }
                }
            }
        }

        return links.sort((a, b) => Math.abs(b.score) - Math.abs(a.score));
    }, [data, causalStrength]);

    const value = useMemo(() => ({ nodes, links }), [nodes, links]);

    const [focus, setFocus] = useState(-1);
    const [showFlowAnalyzer, setShowFlowAnalyzer] = useState(false);

    const handleClickCircle = useCallback((fid: string | null) => {
        if (fid === null) {
            return setFocus(-1);
        }
        const idx = selectedFields.findIndex(f => f.fid === fid);
        if (mode === 'explore') {
            setFocus(idx === focus ? -1 : idx);
        }
    }, [mode, focus, selectedFields]);

    const toggleFlowAnalyzer = useCallback(() => {
        setShowFlowAnalyzer(display => !display);
    }, []);

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
    }, [selectedFields, value, mode === 'explore' ? focus : -1, cutThreshold]);

    const handleLink = useCallback((srcFid: string, tarFid: string, type: ModifiableBgKnowledge['type']) => {
        if (srcFid === tarFid) {
            return;
        }
        onLinkTogether(selectedFields.findIndex(f => f.fid === srcFid), selectedFields.findIndex(f => f.fid === tarFid), type);
    }, [selectedFields, onLinkTogether]);

    const [selectedSubtree, setSelectedSubtree] = useState<string[]>([]);

    const onNodeSelectedRef = useRef(onNodeSelected);
    onNodeSelectedRef.current = onNodeSelected;

    const handleNodeSelect = useCallback<typeof onNodeSelected>((node, simpleCause, simpleEffect, composedCause, composedEffect) => {
        onNodeSelectedRef.current(node, simpleCause, simpleEffect, composedCause, composedEffect);
        const shallowSubtree = simpleEffect.reduce<Readonly<NodeWithScore>[]>(
            (list, f) => {
                if (!list.some((which) => which.field.fid === f.field.fid)) {
                    list.push(f);
                }
                return list;
            },
            [...simpleCause]
        );
        setSelectedSubtree(shallowSubtree.map(node => node.field.fid));
    }, []);

    const forceRelayoutRef = useRef<() => void>(() => {});

    useEffect(() => {
        setFocus(-1);
        onNodeSelectedRef.current(null, [], [], [], []);
    }, [mode]);

    const [limit, setLimit] = useState(20);
    const [autoLayout, setAutoLayout] = useState(true);

    const forceLayout = useCallback(() => {
        setAutoLayout(true);
        forceRelayoutRef.current();
    }, []);

    useEffect(() => {
        if (mode === 'edit') {
            synchronizePredictionsUsingCausalResult();
        }
    }, [mode, synchronizePredictionsUsingCausalResult]);

    useEffect(() => {
        setMode('explore');
    }, [allowEdit]);

    return (<>
        <Container onClick={() => focus !== -1 && setFocus(-1)}>
            <MainView>
                <ExplorerMainView
                    selectedSubtree={selectedSubtree}
                    forceRelayoutRef={forceRelayoutRef}
                    value={value}
                    limit={limit}
                    preconditions={preconditions}
                    focus={focus === -1 ? null : focus}
                    mode={mode}
                    cutThreshold={cutThreshold}
                    onClickNode={handleClickCircle}
                    toggleFlowAnalyzer={toggleFlowAnalyzer}
                    onLinkTogether={handleLink}
                    onRevertLink={onRevertLink}
                    onRemoveLink={onRemoveLink}
                    autoLayout={autoLayout}
                    renderNode={renderNode}
                    allowZoom={allowZoom}
                    handleLasso={handleLasso}
                    style={{
                        width: '100%',
                        height: '100%',
                    }}
                />
            </MainView>
            <Floating position="absolute" direction="start" onRenderAside={() => (<Icon iconName="Waffle" />)}>
                <Tools>
                    <DefaultButton
                        style={{
                            flexGrow: 0,
                            flexShrink: 0,
                            flexBasis: 'max-content',
                            padding: '0.4em 0',
                        }}
                        iconProps={{ iconName: 'Repair' }}
                        onClick={forceLayout}
                    >
                        刷新布局
                    </DefaultButton>
                    <Toggle
                        label="画布缩放"
                        checked={allowZoom}
                        onChange={(_, checked) => setAllowZoom(Boolean(checked))}
                        onText="On"
                        offText="Off"
                        inlineLabel
                    />
                    {allowEdit && (
                        <Toggle
                            // label="Modify Constraints"
                            label="编辑因果关系"
                            checked={mode === 'edit'}
                            onChange={(_, checked) => setMode(checked ? 'edit' : 'explore')}
                            onText="On"
                            offText="Off"
                            inlineLabel
                        />
                    )}
                    <Toggle
                        label="自动布局"
                        checked={autoLayout}
                        onChange={(_, checked) => setAutoLayout(Boolean(checked))}
                        onText="On"
                        offText="Off"
                        inlineLabel
                    />
                    <Slider
                        // label="Display Limit"
                        label="边显示上限"
                        min={1}
                        max={Math.max(links.length, limit, 10)}
                        value={limit}
                        onChange={value => setLimit(value)}
                    />
                    {/* TODO: 现在没有有意义的权重，暂时隐藏 */}
                    {false && (
                        <Slider
                            label="按权重筛选"
                            min={0}
                            max={1}
                            step={0.01}
                            value={cutThreshold}
                            showValue
                            onChange={d => setCutThreshold(d)}
                        />
                    )}
                </Tools>
            </Floating>
        </Container>
        <ErrorBoundary>
            <FlowAnalyzer
                display={showFlowAnalyzer}
                dataSource={dataSource}
                data={value}
                limit={limit}
                index={mode === 'explore' ? focus : -1}
                cutThreshold={cutThreshold}
                onClickNode={handleClickCircle}
                onUpdate={handleNodeSelect}
            />
        </ErrorBoundary>
    </>);
};


export default observer(Explorer);
