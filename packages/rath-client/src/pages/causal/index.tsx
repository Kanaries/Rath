import { DefaultButton, Label, PrimaryButton, Spinner, Stack } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useState } from 'react';
import { IFieldMeta } from '../../interfaces';
import { useGlobalStore } from '../../store';
import CrossFilter from './crossFilter';
import Params from './params';
import RelationMatrixHeatMap from './relationMatrixHeatMap';
import RelationTree from './tree';

const CausalPage: React.FC = () => {
    const { dataSourceStore, causalStore } = useGlobalStore();
    const { fieldMetas, cleanedData } = dataSourceStore;
    const [fieldGroup, setFieldGroup] = useState<IFieldMeta[]>([]);
    const { igMatrix, causalStrength, computing } = causalStore;

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
    return (
        <div className="content-container">
            <div className="card">
                <Label>Causal Analysis</Label>
                <Stack tokens={{ childrenGap: '1em' }} horizontal style={{ marginTop: '1em' }}>
                    <DefaultButton text="Clear Group" onClick={() => setFieldGroup([])} />
                    <PrimaryButton
                        text="Causal Discovery"
                        onClick={() => {
                            causalStore.causalDiscovery(cleanedData, fieldMetas);
                        }}
                    />
                    <Params />
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
                            causalStrength.length === fieldMetas.length &&
                            !computing && (
                                <RelationMatrixHeatMap
                                    
                                    // absolute
                                    fields={fieldMetas}
                                    data={causalStrength}
                                    onSelect={onFieldGroupSelect}
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
