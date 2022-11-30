import { Stack } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import React, { RefObject, useCallback, useMemo, useRef } from 'react';
import produce from 'immer';
import styled from 'styled-components';
import { IFieldMeta } from '../../../interfaces';
import { useGlobalStore } from '../../../store';
import { useCausalViewContext } from '../../../store/causalStore/viewStore';
import { mergeCausalPag, resolvePreconditionsFromCausal, transformPreconditions } from '../../../utils/resolve-causal';
import Explorer from '../explorer';
import Params from '../params';
import type { BgKnowledge, BgKnowledgePagLink, IFunctionalDep, ModifiableBgKnowledge } from '../config';
import ModelStorage from '../modelStorage';
import Exploration, { Subtree } from '../exploration';
import MatrixPanel, { MATRIX_TYPE } from '../matrixPanel';
import type { useDataViews } from '../hooks/dataViews';
import type { GraphNodeAttributes } from '../explorer/graph-utils';


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

export interface CausalModalProps {
    dataContext: ReturnType<typeof useDataViews>;
    modifiablePrecondition: ModifiableBgKnowledge[];
    setModifiablePrecondition: (precondition: ModifiableBgKnowledge[] | ((prev: ModifiableBgKnowledge[]) => ModifiableBgKnowledge[])) => void;
    functionalDependencies: IFunctionalDep[];
    renderNode: (node: Readonly<IFieldMeta>) => GraphNodeAttributes | undefined;
}

export const CausalExplorer = observer<
    Omit<CausalModalProps, 'functionalDependencies'> & {
        allowEdit: boolean;
        listenerRef?: RefObject<{ onSubtreeSelected?: (subtree: Subtree | null) => void }>;
    }
>(function CausalExplorer ({
    allowEdit,
    modifiablePrecondition,
    setModifiablePrecondition,
    renderNode,
    listenerRef,
}) {
    const { __deprecatedCausalStore: causalStore } = useGlobalStore();
    const { igMatrix, selectedFields, causalStrength } = causalStore;

    const viewContext = useCausalViewContext();

    const handleLasso = useCallback((fields: IFieldMeta[]) => {
        for (const f of fields) {
            viewContext?.toggleNodeSelected(f.fid);
        }
    }, [viewContext]);

    const handleSubTreeSelected = useCallback((subtree: Subtree | null) => {
        listenerRef?.current?.onSubtreeSelected?.(subtree);
    }, [listenerRef]);

    const handleLinkTogether = useCallback((srcIdx: number, tarIdx: number, type: ModifiableBgKnowledge['type']) => {
        setModifiablePrecondition((list) => {
            return list.concat([{
                src: selectedFields[srcIdx].fid,
                tar: selectedFields[tarIdx].fid,
                type,
            }]);
        });
    }, [selectedFields, setModifiablePrecondition]);

    const handleRevertLink = useCallback((srcFid: string, tarFid: string) => setModifiablePrecondition((list) => {
        return list.map((link) => {
            if (link.src === srcFid && link.tar === tarFid) {
                return produce(link, draft => {
                    draft.type = ({
                        "must-link": 'must-not-link',
                        "must-not-link": 'must-link',
                        "directed-must-link": 'directed-must-not-link',
                        "directed-must-not-link": 'directed-must-link',
                    } as const)[draft.type];
                });
            }
            return link;
        });
    }), [setModifiablePrecondition]);

    const handleRemoveLink = useCallback((srcFid: string, tarFid: string) => setModifiablePrecondition((list) => {
        return list.filter((link) => {
            return !(link.src === srcFid && link.tar === tarFid);
        });
    }), [setModifiablePrecondition]);

    const synchronizePredictionsUsingCausalResult = useCallback(() => {
        setModifiablePrecondition(resolvePreconditionsFromCausal(causalStrength, selectedFields));
    }, [setModifiablePrecondition, causalStrength, selectedFields]);

    return (
        <Explorer
            allowEdit={allowEdit}
            scoreMatrix={igMatrix}
            preconditions={modifiablePrecondition}
            onLinkTogether={handleLinkTogether}
            renderNode={renderNode}
            onRevertLink={handleRevertLink}
            onRemoveLink={handleRemoveLink}
            synchronizePredictionsUsingCausalResult={synchronizePredictionsUsingCausalResult}
            handleLasso={handleLasso}
            handleSubTreeSelected={handleSubTreeSelected}
        />
    );
});

const CausalModal: React.FC<CausalModalProps> = ({
    dataContext,
    modifiablePrecondition,
    setModifiablePrecondition,
    renderNode,
    functionalDependencies,
}) => {
    const { dataSourceStore, __deprecatedCausalStore: causalStore } = useGlobalStore();
    const { fieldMetas } = dataSourceStore;
    const { focusFieldIds, computing, igMatrix, selectedFields, causalStrength } = causalStore;
    const { dataSubset } = dataContext;

    /** @deprecated FCI 已经迁移到 preconditionPag 参数，等到所有算法更新完可以删掉对应逻辑 */
    const precondition = useMemo<BgKnowledge[]>(() => {
        if (computing || igMatrix.length !== selectedFields.length) {
            return [];
        }
        return modifiablePrecondition.reduce<BgKnowledge[]>((list, decl) => {
            const srcIdx = selectedFields.findIndex((f) => f.fid === decl.src);
            const tarIdx = selectedFields.findIndex((f) => f.fid === decl.tar);

            if (srcIdx !== -1 && tarIdx !== -1) {
                if (decl.type === 'directed-must-link' || decl.type === 'directed-must-not-link') {
                    list.push({
                        src: decl.src,
                        tar: decl.tar,
                        type: decl.type === 'directed-must-link' ? 1 : -1,
                    });
                } else {
                    list.push({
                        src: decl.src,
                        tar: decl.tar,
                        type: decl.type === 'must-link' ? 1 : -1,
                    }, {
                        src: decl.tar,
                        tar: decl.src,
                        type: decl.type === 'must-link' ? 1 : -1,
                    });
                }
            }

            return list;
        }, []);
    }, [igMatrix, modifiablePrecondition, selectedFields, computing]);

    const preconditionPag = useMemo<BgKnowledgePagLink[]>(() => {
        if (computing || igMatrix.length !== selectedFields.length) {
            return [];
        }
        return transformPreconditions(modifiablePrecondition, selectedFields);
    }, [igMatrix, modifiablePrecondition, selectedFields, computing]);
    
    const viewContext = useCausalViewContext();

    const appendFields2Group = useCallback((fidArr: string[]) => {
        for (const fid of fidArr) {
            viewContext?.toggleNodeSelected(fid);
        }
    }, [viewContext]);

    const onFieldGroupSelect = useCallback(
        (xFid: string, yFid: string) => {
            causalStore.setFocusNodeIndex(fieldMetas.findIndex((f) => f.fid === xFid));
            appendFields2Group([xFid, yFid]);
        },
        [appendFields2Group, causalStore, fieldMetas]
    );

    const edges = useMemo(() => {
        return mergeCausalPag(causalStrength, modifiablePrecondition, fieldMetas);
    }, [causalStrength, fieldMetas, modifiablePrecondition]);

    const listenerRef = useRef<{ onSubtreeSelected?: (subtree: Subtree | null) => void }>({});

    return (
        <Container>
            <div>
                <Stack tokens={{ childrenGap: '1em' }} horizontal style={{ marginTop: '1em' }}>
                    <ModelStorage />
                    <Params
                        dataSource={dataSubset}
                        focusFields={focusFieldIds}
                        bgKnowledge={preconditionPag}
                        precondition={precondition}
                        funcDeps={functionalDependencies}
                    />
                </Stack>
                <MatrixPanel
                    fields={selectedFields}
                    dataSource={dataSubset}
                    onMatrixPointClick={onFieldGroupSelect}
                    onCompute={(matKey) => {
                        switch (matKey) {
                            case MATRIX_TYPE.conditionalMutualInfo:
                                causalStore.computeIGCondMatrix(dataSubset, selectedFields);
                                break;
                            case MATRIX_TYPE.causal:
                                causalStore.causalDiscovery(dataSubset, precondition, preconditionPag, functionalDependencies);
                                break;
                            case MATRIX_TYPE.mutualInfo:
                            default:
                                causalStore.computeIGMatrix(dataSubset, selectedFields);
                                break;
                        }
                    }}
                    diagram={(
                        <CausalExplorer
                            allowEdit
                            dataContext={dataContext}
                            modifiablePrecondition={modifiablePrecondition}
                            setModifiablePrecondition={setModifiablePrecondition}
                            renderNode={renderNode}
                            listenerRef={listenerRef}
                        />
                    )}
                />
            </div>
            <div style={{ flexGrow: 1.4, display: 'flex', flexDirection: 'column' }}>
                <Exploration
                    context={dataContext}
                    functionalDependencies={functionalDependencies}
                    edges={edges}
                    ref={listenerRef}
                />
            </div>
        </Container>
    );
};

export default observer(CausalModal);
