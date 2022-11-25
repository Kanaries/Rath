import { Stack } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useMemo } from 'react';
import produce from 'immer';
import styled from 'styled-components';
import { IFieldMeta } from '../../../interfaces';
import { useGlobalStore } from '../../../store';
import { resolvePreconditionsFromCausal, transformPreconditions } from '../../../utils/resolve-causal';
import Explorer from '../explorer';
import Params from '../params';
import { BgKnowledge, BgKnowledgePagLink, ModifiableBgKnowledge } from '../config';
import ModelStorage from '../modelStorage';
import MatrixPanel, { MATRIX_TYPE } from '../matrixPanel';
import type { useInteractFieldGroups } from '../hooks/interactFieldGroup';
import type { useDataViews } from '../hooks/dataViews';
import type { GraphNodeAttributes } from '../explorer/graph-utils';


const Container = styled.div`
    flex-grow: 1;
    flex-shrink: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
`;

export interface CausalModalProps {
    dataContext: ReturnType<typeof useDataViews>;
    modifiablePrecondition: ModifiableBgKnowledge[];
    setModifiablePrecondition: (precondition: ModifiableBgKnowledge[] | ((prev: ModifiableBgKnowledge[]) => ModifiableBgKnowledge[])) => void;
    renderNode: (node: Readonly<IFieldMeta>) => GraphNodeAttributes | undefined;
    interactFieldGroups: ReturnType<typeof useInteractFieldGroups>;
}

export const CausalExplorer = observer<CausalModalProps & { allowEdit: boolean }>(function CausalExplorer ({
    allowEdit,
    dataContext,
    modifiablePrecondition,
    setModifiablePrecondition,
    renderNode,
    interactFieldGroups,
}) {
    const { causalStore } = useGlobalStore();
    const { igMatrix, selectedFields, causalStrength } = causalStore;
    const { dataSubset } = dataContext;
    const { appendFields2Group, setFieldGroup } = interactFieldGroups;

    const handleLasso = useCallback((fields: IFieldMeta[]) => {
        setFieldGroup(fields);
    }, [setFieldGroup]);

    const handleSubTreeSelected = useCallback((node: Readonly<IFieldMeta> | null) => {
            if (node) {
                appendFields2Group([node.fid]);
            }
        },
        [appendFields2Group]
    );

    const handleLinkTogether = useCallback((srcIdx: number, tarIdx: number, type: ModifiableBgKnowledge['type']) => {
        setModifiablePrecondition((list) => {
            return list.concat([{
                src: selectedFields[srcIdx].fid,
                tar: selectedFields[tarIdx].fid,
                type,
            }]);
        });
    }, [selectedFields, setModifiablePrecondition]);

    const synchronizePredictionsUsingCausalResult = useCallback(() => {
        setModifiablePrecondition(resolvePreconditionsFromCausal(causalStrength, selectedFields));
    }, [setModifiablePrecondition, causalStrength, selectedFields]);

    return (
        <Explorer
            allowEdit={allowEdit}
            dataSource={dataSubset}
            scoreMatrix={igMatrix}
            preconditions={modifiablePrecondition}
            onNodeSelected={handleSubTreeSelected}
            onLinkTogether={handleLinkTogether}
            renderNode={renderNode}
            onRevertLink={(srcIdx, tarIdx) =>
                setModifiablePrecondition((list) => {
                    return list.map((link) => {
                        if (link.src === srcIdx && link.tar === tarIdx) {
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
                })
            }
            synchronizePredictionsUsingCausalResult={synchronizePredictionsUsingCausalResult}
            handleLasso={handleLasso}
        />
    );
});

const CausalModal: React.FC<CausalModalProps> = ({
    dataContext,
    modifiablePrecondition,
    setModifiablePrecondition,
    renderNode,
    interactFieldGroups,
}) => {
    const { dataSourceStore, causalStore } = useGlobalStore();
    const { fieldMetas } = dataSourceStore;
    const { focusFieldIds, computing, igMatrix, selectedFields } = causalStore;
    const { dataSubset } = dataContext;

    useEffect(() => {
        causalStore.updateCausalAlgorithmList(fieldMetas);
    }, [causalStore, fieldMetas]);

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
    
    const { appendFields2Group } = interactFieldGroups;

    const onFieldGroupSelect = useCallback(
        (xFid: string, yFid: string) => {
            causalStore.setFocusNodeIndex(fieldMetas.findIndex((f) => f.fid === xFid));
            appendFields2Group([xFid, yFid]);
        },
        [appendFields2Group, causalStore, fieldMetas]
    );

    return (
        <Container>
            <Stack tokens={{ childrenGap: '1em' }} horizontal style={{ marginTop: '1em' }}>
                <ModelStorage />
                <Params
                    dataSource={dataSubset}
                    focusFields={focusFieldIds}
                    bgKnowledge={preconditionPag}
                    precondition={precondition}
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
                            causalStore.causalDiscovery(dataSubset, precondition, preconditionPag);
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
                        interactFieldGroups={interactFieldGroups}
                    />
                )}
            />
        </Container>
    );
};

export default observer(CausalModal);
