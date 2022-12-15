import { forwardRef } from "react";
import styled, { StyledComponentProps } from "styled-components";
import type { IFieldMeta } from "../../../interfaces";
import type { EdgeAssert } from "../../../store/causalStore/modelStore";
import type { Subtree } from "../submodule";
import GraphView from "./graphView";


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
    weightThreshold: number;
    confThreshold: number;
    limit?: number;
    mode: 'explore' | 'edit';
    onClickNode?: (fid: string | null) => void;
    onLinkTogether: (srcFid: string, tarFid: string, type: EdgeAssert) => void;
    onRevertLink: (srcFid: string, tarFid: string) => void;
    onRemoveLink: (srcFid: string, tarFid: string) => void;
    forceRelayoutRef: React.MutableRefObject<() => void>;
    allowZoom: boolean;
    handleLasso?: (fields: IFieldMeta[]) => void;
    handleSubTreeSelected?: (subtree: Subtree | null) => void;
}, never>, 'onChange' | 'ref'>;

const ExplorerMainView = forwardRef<HTMLDivElement, ExplorerMainViewProps>(({
    weightThreshold,
    confThreshold,
    mode,
    limit,
    onClickNode,
    onLinkTogether,
    onRevertLink,
    onRemoveLink,
    forceRelayoutRef,
    allowZoom,
    handleLasso,
    handleSubTreeSelected,
    ...props
}, ref) => {
    return (
        <Container {...props} ref={ref}>
            <GraphView
                forceRelayoutRef={forceRelayoutRef}
                limit={limit}
                mode={mode}
                weightThreshold={weightThreshold}
                confThreshold={confThreshold}
                onClickNode={onClickNode}
                onLinkTogether={onLinkTogether}
                onRevertLink={onRevertLink}
                onRemoveLink={onRemoveLink}
                allowZoom={allowZoom}
                handleLasso={handleLasso}
                handleSubtreeSelected={handleSubTreeSelected}
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
