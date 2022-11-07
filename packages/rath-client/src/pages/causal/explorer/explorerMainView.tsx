import { forwardRef } from "react";
import styled, { StyledComponentProps } from "styled-components";
import type { IFieldMeta } from "../../../interfaces";
import useErrorBoundary from "../../../hooks/use-error-boundary";
import { BgKnowledge } from "../config";
// import DAGView from "./DAGView";
// import ForceView from "./forceView";
import GraphView from "./graphView";
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
    fields: readonly Readonly<IFieldMeta>[];
    value: Readonly<DiagramGraphData>;
    /** @default 0 */
    cutThreshold?: number;
    mode: 'explore' | 'edit';
    onClickNode?: (node: DiagramGraphData['nodes'][number]) => void;
    focus: number | null;
    onLinkTogether: (srcFid: string, tarFid: string) => void;
    preconditions: BgKnowledge[];
}, never>, 'onChange' | 'ref'>;

const ExplorerMainView = forwardRef<HTMLDivElement, ExplorerMainViewProps>(({
    fields, value, focus, cutThreshold = 0, mode, onClickNode, onLinkTogether, preconditions, ...props },
    ref
) => {
    const ErrorBoundary = useErrorBoundary((err, info) => {
        console.error(err ?? info);
        return <div style={{
            flexGrow: 1,
            flexShrink: 1,
            width: '60%',
        }} />;
        // return <p>{info}</p>;
    }, [fields, value, cutThreshold]);

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
                    fields={fields}
                    value={value}
                    mode={mode}
                    preconditions={preconditions}
                    cutThreshold={cutThreshold}
                    onClickNode={onClickNode}
                    onLinkTogether={onLinkTogether}
                    focus={focus}
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
