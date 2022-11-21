import { Stack } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import produce from 'immer';
import { IFieldMeta } from '../../interfaces';
import { useGlobalStore } from '../../store';
import { resolvePreconditionsFromCausal } from '../../utils/resolve-causal';
import Explorer from './explorer';
import Params from './params';
import type { BgKnowledge, ModifiableBgKnowledge } from './config';
import ModelStorage from './modelStorage';
import MatrixPanel, { MATRIX_TYPE } from './matrixPanel';
import { useInteractFieldGroups } from './hooks/interactFieldGroup';
import { useDataViews } from './hooks/dataViews';
import DatasetPanel from './datasetPanel';
import ManualAnalyzer from './manualAnalyzer';
import PreconditionPanel from './precondition/preconditionPanel';
import type { GraphNodeAttributes } from './explorer/graph-utils';

const CausalPage: React.FC = () => {
    const { dataSourceStore, causalStore } = useGlobalStore();
    const { fieldMetas, cleanedData } = dataSourceStore;
    const interactFieldGroups = useInteractFieldGroups(fieldMetas);
    const { appendFields2Group } = interactFieldGroups;
    const { igMatrix, causalFields, causalStrength, computing, selectedFields, focusFieldIds } = causalStore;

    const [modifiablePrecondition, __unsafeSetModifiablePrecondition] = useState<ModifiableBgKnowledge[]>([]);

    const setModifiablePrecondition = useCallback((next: ModifiableBgKnowledge[] | ((prev: ModifiableBgKnowledge[]) => ModifiableBgKnowledge[])) => {
        __unsafeSetModifiablePrecondition(prev => {
            const list = typeof next === 'function' ? next(prev) : next;
            return list.reduce<ModifiableBgKnowledge[]>((links, link) => {
                if (link.src === link.type) {
                    // 禁止自环边
                    return links;
                }
                const overloadIdx = links.findIndex(
                    which => [which.src, which.tar].every(node => [link.src, link.tar].includes(node))
                );
                if (overloadIdx !== -1) {
                    const temp = links.map(l => l);
                    temp.splice(overloadIdx, 1, link);
                    return temp;
                } else {
                    return links.concat([link]);
                }
            }, []);
        });
    }, []);

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
    const dataContext = useDataViews(cleanedData);
    const { dataSubset } = dataContext;

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

    const handleSubTreeSelected = useCallback((node: Readonly<IFieldMeta> | null) => {
            if (node) {
                appendFields2Group([node.fid]);
            }
        },
        [appendFields2Group]
    );

    const exploringFields = igMatrix.length === causalStrength.length ? causalFields : selectedFields;

    const handleLinkTogether = useCallback((srcIdx: number, tarIdx: number) => {
        setModifiablePrecondition((list) => {
            return list.concat([{
                src: exploringFields[srcIdx].fid,
                tar: exploringFields[tarIdx].fid,
                type: 'directed-must-link',
            }]);
        });
    }, [exploringFields, setModifiablePrecondition]);

    // 结点可以 project 一些字段信息
    const renderNode = useCallback((node: Readonly<IFieldMeta>): GraphNodeAttributes | undefined => {
        const value = 2 / (1 + Math.exp(-1 * node.features.entropy / 2)) - 1;
        return {
            style: {
                stroke: `rgb(${Math.floor(95 * (1 - value))},${Math.floor(149 * (1 - value))},255)`,
            },
        };
    }, []);

    const synchronizePredictionsUsingCausalResult = useCallback(() => {
        setModifiablePrecondition(resolvePreconditionsFromCausal(causalStrength, fieldMetas));
    }, [setModifiablePrecondition, causalStrength, fieldMetas]);

    return (
        <div className="content-container">
            <div className="card">
                <h1 style={{ fontSize: '1.6em', fontWeight: 500 }}>因果分析</h1>
                <DatasetPanel context={dataContext} />
                <PreconditionPanel
                    modifiablePrecondition={modifiablePrecondition}
                    setModifiablePrecondition={setModifiablePrecondition}
                    renderNode={renderNode}
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
                    diagram={(
                        <Explorer
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
                        />
                    )}
                />
            </div>
            <ManualAnalyzer context={dataContext} interactFieldGroups={interactFieldGroups} />
        </div>
    );
};

export default observer(CausalPage);
