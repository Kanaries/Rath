import { DefaultButton, Stack } from '@fluentui/react';
import { getFieldRelationMatrix } from '@kanaries/loa';
import React, { useCallback, useMemo, useState } from 'react';
import { IFieldMeta } from '../../interfaces';
import { useGlobalStore } from '../../store';
import CrossFilter from './crossFilter';
import RelationGraph from './relationGraph';
import RelationMatrixHeatMap from './relationMatrixHeatMap';

const CausualPage: React.FC = () => {
    const { dataSourceStore } = useGlobalStore();
    const { fieldMetas, cleanedData } = dataSourceStore;
    const [fieldGroup, setFieldGroup] = useState<IFieldMeta[]>([]);

    const relationMatrix = useMemo(() => {
        return getFieldRelationMatrix(cleanedData, fieldMetas);
    }, [fieldMetas, cleanedData]);
    const compareMatrix = useMemo(() => {
        const ans: number[][] = [];
        for (let i = 0; i < relationMatrix.length; i++) {
            ans.push([]);
            for (let j = 0; j < relationMatrix[i].length; j++) {
                ans[i].push(relationMatrix[i][j] - relationMatrix[j][i]);
            }
        }
        return ans;
    }, [relationMatrix]);

    const onFieldGroupSelect = useCallback(
        (xFid: string, yFid: string) => {
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
        [setFieldGroup, fieldMetas]
    );
    return (
        <div className="content-container">
            <div className="card">
                <h1>Causal</h1>
                <Stack horizontal style={{ marginTop: '1em' }}>
                    <DefaultButton text="Clear Group" onClick={() => setFieldGroup([])} />
                </Stack>

                <div style={{ marginTop: '1em', display: 'flex' }}>
                    <div>
                        {cleanedData.length > 0 && (
                            <RelationMatrixHeatMap
                                absolute
                                fields={fieldMetas}
                                data={relationMatrix}
                                onSelect={onFieldGroupSelect}
                            />
                        )}
                    </div>
                    <div>
                        {cleanedData.length > 0 && (
                            <RelationMatrixHeatMap
                                fields={fieldMetas}
                                data={compareMatrix}
                                onSelect={onFieldGroupSelect}
                            />
                        )}
                    </div>
                </div>
                <div>
                    <RelationGraph matrix={relationMatrix} fields={fieldMetas} />
                </div>

                <div>
                    {cleanedData.length > 0 && fieldGroup.length > 0 && (
                        <CrossFilter fields={fieldGroup} dataSource={cleanedData} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default CausualPage;
