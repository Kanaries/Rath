import { ComboBox, DefaultButton, Label, PrimaryButton, Spinner, Stack } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { IFieldMeta } from '../../interfaces';
import { useGlobalStore } from '../../store';
import Explorer from './explorer';
import CrossFilter from './crossFilter';
import Params from './params';
import RelationMatrixHeatMap from './relationMatrixHeatMap';
import RelationTree from './tree';
import { NodeWithScore } from './explorer/flowAnalyzer';
import { BgKnowledge } from './config';

const CausalPage: React.FC = () => {
    const { dataSourceStore, causalStore } = useGlobalStore();
    const { fieldMetas, cleanedData } = dataSourceStore;
    const [fieldGroup, setFieldGroup] = useState<IFieldMeta[]>([]);
    const { igMatrix, causalStrength, causalFields, computing } = causalStore;

    const [focusFields, setFocusFields] = useState<string[]>([]);
    const [precondition, setPrecondition] = useState<BgKnowledge[]>([]);

    useEffect(() => {
        setFocusFields(fieldMetas.filter(f => f.disable !== true).map(f => f.fid));
        setPrecondition(
            fieldMetas.reduce<BgKnowledge[]>((list, f) => {
                
                return list;
            }, [])
        );
    }, [fieldMetas]);

    useEffect(() => {
        causalStore.updateCausalAlgorithmList(fieldMetas);
    }, [causalStore, fieldMetas]);

    useEffect(() => {
        causalStore.computeIGMatrix(cleanedData, fieldMetas);
    }, [fieldMetas, cleanedData, causalStore]);

    // useEffect(() => {
    //     causalStore.computeIGCondMatrix(cleanedData, fieldMetas);
    // }, [fieldMetas, cleanedData, causalStore]);

    const onFieldGroupSelect = useCallback(
        (xFid: string, yFid: string) => {
            causalStore.setFocusNodeIndex(fieldMetas.findIndex(f => f.fid === xFid));
            setFieldGroup((group) => {
                const nextGroup = [...group];
                if (!nextGroup.find((f) => f.fid === xFid)) {
                    nextGroup.push(fieldMetas.find((f) => f.fid === xFid)!);
                }
                if (!nextGroup.find((f) => f.fid === yFid)) {
                    nextGroup.push(fieldMetas.find((f) => f.fid === yFid)!);
                }
                return nextGroup;
            });
        },
        [setFieldGroup, fieldMetas, causalStore]
    );

    // const compareMatrix = useMemo(() => {
    //     const ans: number[][] = [];
    //     for (let i = 0; i < igMatrix.length; i++) {
    //         ans.push([]);
    //         for (let j = 0; j < igMatrix[i].length; j++) {
    //             ans[i].push(igMatrix[i][j] - igMatrix[j][i]);
    //         }
    //     }
    //     return ans;
    // }, [igMatrix]);

    const handleSubTreeSelected = useCallback((
        node: Readonly<IFieldMeta> | null,
        simpleCause: readonly Readonly<NodeWithScore>[],
        simpleEffect: readonly Readonly<NodeWithScore>[],
        composedCause: readonly Readonly<NodeWithScore>[],
        composedEffect: readonly Readonly<NodeWithScore>[],
    ) => {
        if (node) {
            const allEffect = composedEffect.reduce<Readonly<NodeWithScore>[]>((list, f) => {
                if (!list.some(which => which.field.fid === f.field.fid)) {
                    list.push(f);
                }
                return list;
            }, [...simpleEffect]).sort((a, b) => b.score - a.score);
            // console.log(allEffect)
            setFieldGroup([
                node,
                ...allEffect.map(f => f.field),
            ]);
        }
    }, []);

    const focusFieldsOption = useMemo(() => fieldMetas.map(f => ({
        key: f.fid,
        text: f.name ?? f.fid,
    })), [fieldMetas]);

    const independencyWeightedCausalStrength = useMemo(() => {
        return causalStrength.map((row, i) => row.map((d, j) => d * igMatrix[i][j]));
    }, [igMatrix, causalStrength]);

    return (
        <div className="content-container">
            <div className="card">
                <Label>Causal Analysis</Label>
                <Stack style={{ marginBlock: '1.6em 3.2em' }}>
                    <ComboBox
                        multiSelect
                        selectedKey={focusFields}
                        label="Selected Fields"
                        allowFreeform
                        options={focusFieldsOption}
                        onChange={(e, option) => {
                            if (option) {
                                const { key, selected } = option;
                                if (focusFields.includes(key as string) && !selected) {
                                    setFocusFields(list => list.filter(f => f !== key));
                                } else if (!focusFields.includes(key as string) && selected) {
                                    setFocusFields(list => [...list, key as string]);
                                }
                            }
                        }}
                    />
                </Stack>
                <Stack tokens={{ childrenGap: '1em' }} horizontal style={{ marginTop: '1em' }}>
                    <DefaultButton text="Clear Group" onClick={() => setFieldGroup([])} />
                    <PrimaryButton
                        text="Causal Discovery"
                        onClick={() => {
                            causalStore.causalDiscovery(
                                cleanedData,
                                fieldMetas,
                                focusFields,
                                precondition,
                                causalStore.causalAlgorithm
                            );
                        }}
                    />
                    <Params focusFields={focusFields} precondition={precondition} />
                </Stack>

                <div style={{ marginTop: '1em', display: 'flex' }}>
                    <div>
                        {cleanedData.length > 0 && igMatrix.length > 0 && (
                            <RelationMatrixHeatMap
                                absolute
                                fields={fieldMetas}
                                data={igMatrix}
                                onSelect={onFieldGroupSelect}
                            />
                        )}
                    </div>
                    {/* <div>
                        {cleanedData.length > 0 && !computing && (
                            <RelationMatrixHeatMap
                                absolute
                                fields={fieldMetas}
                                data={igCondMatrix}
                                onSelect={onFieldGroupSelect}
                            />
                        )}
                        {computing && <Spinner label="computings" />}
                    </div> */}
                    <div>
                        {cleanedData.length > 0 &&
                            causalStrength.length > 0 &&
                            causalStrength.length === causalFields.length &&
                            !computing && (
                                <RelationMatrixHeatMap
                                    
                                    // absolute
                                    fields={causalFields}
                                    data={causalStrength}
                                    // onSelect={onFieldGroupSelect}
                                />
                            )}
                        {computing && <Spinner label="computings" />}
                    </div>
                </div>
                <div>
                    {cleanedData.length > 0 &&
                        causalStrength.length > 0 &&
                        causalStrength.length === fieldMetas.length &&
                        !computing && (
                            <RelationTree
                                matrix={causalStrength}
                                fields={fieldMetas}
                                focusIndex={causalStore.focusNodeIndex}
                                onFocusChange={(index) => {
                                    causalStore.setFocusNodeIndex(index);
                                }}
                            />
                        )}
                </div>
                <div>
                    {cleanedData.length > 0 &&
                        causalStrength.length > 0 &&
                        causalStrength.length === fieldMetas.length &&
                        causalStrength.length === igMatrix.length &&
                        !computing ? (
                            <Explorer
                                dataSource={cleanedData}
                                fields={fieldMetas}
                                compareMatrix={independencyWeightedCausalStrength}
                                onNodeSelected={handleSubTreeSelected}
                            />
                        ) : null
                    }
                </div>
                {/* <div>
                    { !computing && <RelationGraph matrix={causalMatrix} fields={fieldMetas} /> }
                </div> */}

                <div>
                    {cleanedData.length > 0 && fieldGroup.length > 0 && (
                        <CrossFilter fields={fieldGroup} dataSource={cleanedData} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default observer(CausalPage);
