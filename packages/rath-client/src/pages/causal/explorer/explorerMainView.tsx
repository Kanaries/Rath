import { forwardRef } from "react";
import styled, { StyledComponentProps } from "styled-components";
import type { IFieldMeta } from "../../../interfaces";
import type { DiagramGraphData } from ".";
import DAGView from "./DAGView";
import ForceView from "./forceView";


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
}, never>, 'onChange' | 'ref'> & {
    onChange: (value: Readonly<DiagramGraphData>) => void;
    onFocusChange: (index: number) => void;
};

const ExplorerMainView = forwardRef<HTMLDivElement, ExplorerMainViewProps>(({
    fields, value, onChange, onFocusChange, cutThreshold = 0, mode, ...props },
    ref
) => {
    return (
        <Container {...props} ref={ref}>
            <ForceView
                fields={fields}
                value={value}
                onChange={onChange}
                mode={mode}
                cutThreshold={cutThreshold}
                onFocusChange={onFocusChange}
                style={{
                    flexGrow: 1,
                    flexShrink: 1,
                    flexBasis: 0,
                }}
            />
            <DAGView
                fields={fields}
                value={value}
                onChange={onChange}
                mode={mode}
                cutThreshold={cutThreshold}
                onFocusChange={onFocusChange}
                style={{
                    flexGrow: 1,
                    flexShrink: 1,
                    flexBasis: 0,
                }}
            />
        </Container>
    );
});


export default ExplorerMainView;
