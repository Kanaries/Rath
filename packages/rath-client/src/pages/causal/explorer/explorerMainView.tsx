import { forwardRef } from "react";
import styled, { StyledComponentProps } from "styled-components";
import type { IFieldMeta } from "../../../interfaces";
import type { EdgeAssert } from "../../../store/causalStore/modelStore";
import type { Subtree } from "../exploration";
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
    /** @default 0 */
    cutThreshold?: number;
    limit: number;
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
    cutThreshold = 0,
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
                cutThreshold={cutThreshold}
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
