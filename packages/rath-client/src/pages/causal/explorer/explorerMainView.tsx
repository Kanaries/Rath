import { forwardRef } from "react";
import styled, { StyledComponentProps } from "styled-components";
import type { IFieldMeta } from "../../../interfaces";
import useErrorBoundary from "../../../hooks/use-error-boundary";
import type { ModifiableBgKnowledge } from "../config";
// import DAGView from "./DAGView";
// import ForceView from "./forceView";
import GraphView from "./graphView";
import type { GraphNodeAttributes } from "./graph-utils";
import type { DiagramGraphData } from ".";


const Container = styled.div`
    flex-grow: 1;
    flex-shrink: 1;
    width: 400px;
    height: 400px;
    display: flex;
    flex-direction: row;
    align-items: stretch;
    justify-content: stretch;
`;

export type ExplorerMainViewProps = Omit<StyledComponentProps<'div', {}, {
    selectedSubtree: readonly string[];
    value: Readonly<DiagramGraphData>;
    /** @default 0 */
    cutThreshold?: number;
    limit: number;
    mode: 'explore' | 'edit';
    onClickNode?: (fid: string | null) => void;
    toggleFlowAnalyzer?: () => void;
    focus: number | null;
    onLinkTogether: (srcFid: string, tarFid: string, type: ModifiableBgKnowledge['type']) => void;
    onRevertLink: (srcFid: string, tarFid: string) => void;
    onRemoveLink: (srcFid: string, tarFid: string) => void;
    preconditions: ModifiableBgKnowledge[];
    forceRelayoutRef: React.MutableRefObject<() => void>;
    autoLayout: boolean;
    renderNode?: (node: Readonly<IFieldMeta>) => GraphNodeAttributes | undefined,
    allowZoom: boolean;
    handleLasso?: (fields: IFieldMeta[]) => void;
}, never>, 'onChange' | 'ref'>;

const ExplorerMainView = forwardRef<HTMLDivElement, ExplorerMainViewProps>(({
    selectedSubtree,
    value,
    focus,
    cutThreshold = 0,
    mode,
    limit,
    onClickNode,
    onLinkTogether,
    onRevertLink,
    onRemoveLink,
    preconditions,
    forceRelayoutRef,
    autoLayout,
    renderNode,
    toggleFlowAnalyzer,
    allowZoom,
    handleLasso,
    ...props
}, ref) => {
    const ErrorBoundary = useErrorBoundary((err, info) => {
        // console.error(err ?? info);
        return <div style={{
            flexGrow: 1,
            flexShrink: 1,
            width: '100%',
        }} />;
        // return <p>{info}</p>;
    }, [value, cutThreshold, preconditions]);

    return (
        <Container {...props} ref={ref}>
            {/* <ForceView
                fields={fields}
                value={value}
                onClickNode={onClickNode}
                focus={focus}
                mode={mode}
                cutThreshold={cutThreshold}
                style={{
                    flexGrow: 1,
                    flexShrink: 1,
                    width: '40%',
                }}
            /> */}
            <ErrorBoundary>
                <GraphView
                    selectedSubtree={selectedSubtree}
                    forceRelayoutRef={forceRelayoutRef}
                    value={value}
                    limit={limit}
                    mode={mode}
                    preconditions={preconditions}
                    cutThreshold={cutThreshold}
                    onClickNode={onClickNode}
                    toggleFlowAnalyzer={toggleFlowAnalyzer ?? (() => {})}
                    onLinkTogether={onLinkTogether}
                    onRevertLink={onRevertLink}
                    onRemoveLink={onRemoveLink}
                    focus={focus}
                    autoLayout={autoLayout}
                    renderNode={renderNode}
                    allowZoom={allowZoom}
                    handleLasso={handleLasso}
                    style={{
                        flexGrow: 1,
                        flexShrink: 1,
                        width: '100%',
                    }}
                />
                {/* <DAGView
                    fields={fields}
                    value={value}
                    mode={mode}
                    cutThreshold={cutThreshold}
                    onClickNode={onClickNode}
                    focus={focus}
                    style={{
                        flexGrow: 1,
                        flexShrink: 1,
                        width: '100%',
                    }}
                /> */}
            </ErrorBoundary>
        </Container>
    );
});


export default ExplorerMainView;
