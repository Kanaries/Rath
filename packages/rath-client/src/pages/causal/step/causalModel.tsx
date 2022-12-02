import { Stack } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import { FC, RefObject, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { IFieldMeta } from '../../../interfaces';
import { useGlobalStore } from '../../../store';
import { useCausalViewContext } from '../../../store/causalStore/viewStore';
import type { EdgeAssert } from '../../../store/causalStore/modelStore';
import Explorer from '../explorer';
import Params from '../params';
import ModelStorage from '../modelStorage';
import Exploration, { Subtree } from '../exploration';
import MatrixPanel, { MATRIX_TYPE } from '../matrixPanel';


const Container = styled.div`
    flex-grow: 1;
    flex-shrink: 1;
    display: flex;
    flex-direction: row;
    overflow: hidden;
    > div {
        height: 100%;
        flex-grow: 1;
        flex-shrink: 1;
        flex-basis: 0;
        overflow: auto;
        padding: 0 1em;
        :not(:first-child) {
            border-left: 1px solid #8882;
        }
    }
`;

export const CausalExplorer = observer<{
    allowEdit: boolean;
    listenerRef?: RefObject<{ onSubtreeSelected?: (subtree: Subtree | null) => void }>;
}>(function CausalExplorer ({
    allowEdit,
    listenerRef,
}) {
    const { causalStore } = useGlobalStore();

    const viewContext = useCausalViewContext();

    const handleLasso = useCallback((fields: IFieldMeta[]) => {
        for (const f of fields) {
            viewContext?.toggleNodeSelected(f.fid);
        }
    }, [viewContext]);

    const handleSubTreeSelected = useCallback((subtree: Subtree | null) => {
        listenerRef?.current?.onSubtreeSelected?.(subtree);
    }, [listenerRef]);

    const handleLinkTogether = useCallback((srcFid: string, tarFid: string, assert: EdgeAssert) => {
        causalStore.model.addEdgeAssertion(srcFid, tarFid, assert);
    }, [causalStore]);

    const handleRevertLink = useCallback((srcFid: string, tarFid: string) => {
        causalStore.model.revertEdgeAssertion([srcFid, tarFid]);
    }, [causalStore]);

    const handleRemoveLink = useCallback((srcFid: string, tarFid: string) => {
        causalStore.model.removeEdgeAssertion([srcFid, tarFid]);
    }, [causalStore]);

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

    const appendFields2Group = useCallback((fidArr: string[]) => {
        for (const fid of fidArr) {
            viewContext?.selectNode(fid);
        }
    }, [viewContext]);

    const onFieldGroupSelect = useCallback((xFid: string, yFid: string) => {
        appendFields2Group([xFid, yFid]);
    }, [appendFields2Group]);

    const listenerRef = useRef<{ onSubtreeSelected?: (subtree: Subtree | null) => void }>({});

    return (
        <Container>
            <div>
                <Stack tokens={{ childrenGap: '1em' }} horizontal style={{ marginTop: '1em' }}>
                    <ModelStorage />
                    <Params />
                </Stack>
                <MatrixPanel
                    onMatrixPointClick={onFieldGroupSelect}
                    onCompute={(matKey) => {
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
                    }}
                    diagram={(
                        <CausalExplorer
                            allowEdit
                            listenerRef={listenerRef}
                        />
                    )}
                />
            </div>
            <div style={{ flexGrow: 1.4, display: 'flex', flexDirection: 'column' }}>
                <Exploration ref={listenerRef} />
            </div>
        </Container>
    );
};

export default observer(CausalModal);
