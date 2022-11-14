import { Stack } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { IFieldMeta } from '../../interfaces';
import { useGlobalStore } from '../../store';
import Explorer from './explorer';
import Params from './params';
import { NodeWithScore } from './explorer/flowAnalyzer';
import type { BgKnowledge, ModifiableBgKnowledge } from './config';
import ModelStorage from './modelStorage';
import MatrixPanel, { MATRIX_TYPE } from './matrixPanel';
import { useInteractFieldGroups } from './hooks/interactFieldGroup';
import { useDataViews } from './hooks/dataViews';
import DatasetPanel from './datasetPanel';
import ManualAnalyzer from './manualAnalyzer';
import PreconditionPanel from './preconditionPanel';

const CausalPage: React.FC = () => {
    const { dataSourceStore, causalStore } = useGlobalStore();
    const { fieldMetas, cleanedData } = dataSourceStore;
    const { appendFields2Group } = useInteractFieldGroups(fieldMetas);
    const { igMatrix, causalFields, causalStrength, computing, selectedFields, focusFieldIds } = causalStore;

    const [modifiablePrecondition, setModifiablePrecondition] = useState<ModifiableBgKnowledge[]>([]);

    const precondition = useMemo<BgKnowledge[]>(() => {
        if (computing || igMatrix.length !== selectedFields.length) {
            return [];
        }
        return modifiablePrecondition.reduce<BgKnowledge[]>((list, decl) => {
            const srcIdx = selectedFields.findIndex((f) => f.fid === decl.src);
            const tarIdx = selectedFields.findIndex((f) => f.fid === decl.tar);

            if (srcIdx !== -1 && tarIdx !== -1) {
                list.push({
                    src: decl.src,
                    tar: decl.tar,
                    type:
                        decl.type === 'must-link'
                            ? 1
                            : decl.type === 'must-not-link'
                            ? -1
                            : (igMatrix[srcIdx][tarIdx] + 1) / 2, // TODO: 暂时定为一半
                });
            }

            return list;
        }, []);
    }, [igMatrix, modifiablePrecondition, selectedFields, computing]);
    const { dataSubset } = useDataViews(cleanedData);

    useEffect(() => {
        causalStore.updateCausalAlgorithmList(fieldMetas);
    }, [causalStore, fieldMetas]);

    const onFieldGroupSelect = useCallback(
        (xFid: string, yFid: string) => {
            causalStore.setFocusNodeIndex(fieldMetas.findIndex((f) => f.fid === xFid));
            appendFields2Group([xFid, yFid]);
        },
        [appendFields2Group, causalStore, fieldMetas]
    );

    const handleSubTreeSelected = useCallback(
        (
            node: Readonly<IFieldMeta> | null,
            simpleCause: readonly Readonly<NodeWithScore>[],
            simpleEffect: readonly Readonly<NodeWithScore>[],
            composedCause: readonly Readonly<NodeWithScore>[],
            composedEffect: readonly Readonly<NodeWithScore>[]
        ) => {
            if (node) {
                const allEffect = composedEffect
                    .reduce<Readonly<NodeWithScore>[]>(
                        (list, f) => {
                            if (!list.some((which) => which.field.fid === f.field.fid)) {
                                list.push(f);
                            }
                            return list;
                        },
                        [...simpleEffect]
                    )
                    .sort((a, b) => b.score - a.score);
                // console.log(allEffect)
                // setFieldGroup([node, ...allEffect.map((f) => f.field)]);
                appendFields2Group([node.fid, ...allEffect.map((f) => f.field.fid)])
            }
        },
        [appendFields2Group]
    );

    const exploringFields = igMatrix.length === causalStrength.length ? causalFields : selectedFields;

    return (
        <div className="content-container">
            <div className="card">
                <h1 style={{ fontSize: '1.6em', fontWeight: 500 }}>因果分析</h1>
                <DatasetPanel />
                <PreconditionPanel
                    modifiablePrecondition={modifiablePrecondition}
                    setModifiablePrecondition={setModifiablePrecondition}
                />
                <Stack tokens={{ childrenGap: '1em' }} horizontal style={{ marginTop: '1em' }}>
                    <ModelStorage />
                    <Params dataSource={dataSubset} focusFields={focusFieldIds} precondition={precondition} />
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
                                causalStore.causalDiscovery(dataSubset, precondition);
                                break;
                            case MATRIX_TYPE.mutualInfo:
                            default:
                                causalStore.computeIGMatrix(dataSubset, selectedFields);
                                break;
                        }
                    }}
                />
                <div>
                    {!computing ? (
                        <Explorer
                            dataSource={dataSubset}
                            fields={exploringFields}
                            scoreMatrix={igMatrix}
                            preconditions={modifiablePrecondition}
                            onNodeSelected={handleSubTreeSelected}
                            onLinkTogether={(srcIdx, tarIdx) =>
                                setModifiablePrecondition((list) => [
                                    ...list,
                                    {
                                        src: exploringFields[srcIdx].fid,
                                        tar: exploringFields[tarIdx].fid,
                                        type: 'must-link',
                                    },
                                ])
                            }
                            onRemoveLink={(srcIdx, tarIdx) =>
                                setModifiablePrecondition((list) => {
                                    return list.filter((link) => !(link.src === srcIdx && link.tar === tarIdx));
                                })
                            }
                        />
                    ) : null}
                </div>
            </div>
            <ManualAnalyzer />
        </div>
    );
};

export default observer(CausalPage);
