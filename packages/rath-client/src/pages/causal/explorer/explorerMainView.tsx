import { forwardRef } from "react";
import styled, { StyledComponentProps } from "styled-components";
import type { IFieldMeta } from "../../../interfaces";
import type { ModifiableBgKnowledge } from "../config";
import type { Subtree } from "../exploration";
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
    value: Readonly<DiagramGraphData>;
    /** @default 0 */
    cutThreshold?: number;
    limit: number;
    mode: 'explore' | 'edit';
    onClickNode?: (fid: string | null) => void;
    onLinkTogether: (srcFid: string, tarFid: string, type: ModifiableBgKnowledge['type']) => void;
    onRevertLink: (srcFid: string, tarFid: string) => void;
    onRemoveLink: (srcFid: string, tarFid: string) => void;
    preconditions: ModifiableBgKnowledge[];
    forceRelayoutRef: React.MutableRefObject<() => void>;
    autoLayout: boolean;
    renderNode?: (node: Readonly<IFieldMeta>) => GraphNodeAttributes | undefined,
    allowZoom: boolean;
    handleLasso?: (fields: IFieldMeta[]) => void;
    handleSubTreeSelected?: (subtree: Subtree | null) => void;
}, never>, 'onChange' | 'ref'>;

const ExplorerMainView = forwardRef<HTMLDivElement, ExplorerMainViewProps>(({
    value,
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
    allowZoom,
    handleLasso,
    handleSubTreeSelected,
    ...props
}, ref) => {
    return (
        <Container {...props} ref={ref}>
            <GraphView
                forceRelayoutRef={forceRelayoutRef}
                value={value}
                limit={limit}
                mode={mode}
                preconditions={preconditions}
                cutThreshold={cutThreshold}
                onClickNode={onClickNode}
                onLinkTogether={onLinkTogether}
                onRevertLink={onRevertLink}
                onRemoveLink={onRemoveLink}
                autoLayout={autoLayout}
                renderNode={renderNode}
                allowZoom={allowZoom}
                handleLasso={handleLasso}
                handleSubTreeSelected={handleSubTreeSelected}
                style={{
                    flexGrow: 1,
                    flexShrink: 1,
                    width: '100%',
                }}
            />
        </Container>
    );
});


export default ExplorerMainView;
