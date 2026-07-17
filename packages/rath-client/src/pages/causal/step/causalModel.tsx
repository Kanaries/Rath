import { observer } from 'mobx-react-lite';
import { FC, RefObject, useCallback, useMemo, useRef } from 'react';
import { Resizable } from 're-resizable';
import styled from 'styled-components';
import { IFieldMeta } from '../../../interfaces';
import { useGlobalStore } from '../../../store';
import { useCausalViewContext } from '../../../store/causalStore/viewStore';
import type { EdgeAssert } from '../../../store/causalStore/modelStore';
import Explorer from '../explorer';
import Exploration, { Subtree } from '../exploration';
import CausalCanvas, { MATRIX_TYPE } from '../canvas';
import CommandBar from './commandBar';

const Container = styled.div`
    flex-grow: 1;
    flex-shrink: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
`;

const WorkBench = styled.div`
    flex-grow: 1;
    flex-shrink: 1;
    min-height: 0;
    display: flex;
    flex-direction: row;
    align-items: stretch;
    overflow: hidden;
`;

const CanvasArea = styled.div`
    flex-grow: 1;
    flex-shrink: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 0 1em;
`;

const INSPECTOR_WIDTH_KEY = 'rath-causal-inspector-width';

export const CausalExplorer = observer<{
    allowEdit: boolean;
    listenerRef?: RefObject<{ onSubtreeSelected?: (subtree: Subtree | null) => void }>;
}>(function CausalExplorer({ allowEdit, listenerRef }) {
    const { causalStore } = useGlobalStore();

    const viewContext = useCausalViewContext();

    const handleLasso = useCallback(
        (fields: IFieldMeta[]) => {
            for (const f of fields) {
                viewContext?.toggleNodeSelected(f.fid);
            }
        },
        [viewContext]
    );

    const handleSubTreeSelected = useCallback(
        (subtree: Subtree | null) => {
            listenerRef?.current?.onSubtreeSelected?.(subtree);
        },
        [listenerRef]
    );

    const handleLinkTogether = useCallback(
        (srcFid: string, tarFid: string, assert: EdgeAssert) => {
            causalStore.model.addEdgeAssertion(srcFid, tarFid, assert);
        },
        [causalStore]
    );

    const handleRevertLink = useCallback(
        (srcFid: string, tarFid: string) => {
            causalStore.model.revertEdgeAssertion([srcFid, tarFid]);
        },
        [causalStore]
    );

    const handleRemoveLink = useCallback(
        (srcFid: string, tarFid: string) => {
            causalStore.model.removeEdgeAssertion([srcFid, tarFid]);
        },
        [causalStore]
    );

    return (
        <Explorer
            allowEdit={allowEdit}
            onLinkTogether={handleLinkTogether}
            onRevertLink={handleRevertLink}
            onRemoveLink={handleRemoveLink}
            handleLasso={handleLasso}
            handleSubTreeSelected={handleSubTreeSelected}
        />
    );
});

const CausalModal: FC = () => {
    const { causalStore } = useGlobalStore();

    const viewContext = useCausalViewContext();

    const appendFields2Group = useCallback(
        (fidArr: string[]) => {
            for (const fid of fidArr) {
                viewContext?.selectNode(fid);
            }
        },
        [viewContext]
    );

    const onFieldGroupSelect = useCallback(
        (xFid: string, yFid: string) => {
            appendFields2Group([xFid, yFid]);
        },
        [appendFields2Group]
    );

    const listenerRef = useRef<{ onSubtreeSelected?: (subtree: Subtree | null) => void }>({});

    const handleCompute = useCallback(
        (matKey: MATRIX_TYPE) => {
            if (causalStore.operator.busy) {
                return;
            }
            switch (matKey) {
                case MATRIX_TYPE.conditionalMutualInfo:
                    causalStore.computeCondMutualMatrix();
                    break;
                case MATRIX_TYPE.causal:
                    causalStore.run();
                    break;
                case MATRIX_TYPE.mutualInfo:
                default:
                    causalStore.computeMutualMatrix();
                    break;
            }
        },
        [causalStore]
    );

    const defaultInspectorWidth = useMemo(() => {
        const stored = Number(localStorage.getItem(INSPECTOR_WIDTH_KEY));
        return Number.isFinite(stored) && stored >= 320 ? stored : undefined;
    }, []);

    return (
        <Container>
            <CommandBar />
            <WorkBench>
                <CanvasArea>
                    <CausalCanvas
                        onMatrixPointClick={onFieldGroupSelect}
                        onCompute={handleCompute}
                        diagram={<CausalExplorer allowEdit listenerRef={listenerRef} />}
                    />
                </CanvasArea>
                <Resizable
                    defaultSize={{ width: defaultInspectorWidth ?? '40%', height: '100%' }}
                    minWidth={320}
                    maxWidth="65%"
                    enable={{ left: true }}
                    handleStyles={{ left: { width: 5, left: -2 } }}
                    onResizeStop={(_e, _dir, el) => {
                        localStorage.setItem(INSPECTOR_WIDTH_KEY, String(el.getBoundingClientRect().width));
                    }}
                    className="flex flex-col overflow-hidden border-l"
                >
                    <Exploration ref={listenerRef} />
                </Resizable>
            </WorkBench>
        </Container>
    );
};

export default observer(CausalModal);
