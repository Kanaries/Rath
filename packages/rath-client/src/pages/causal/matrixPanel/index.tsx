import { Pivot, PivotItem, PrimaryButton, Spinner } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { IFieldMeta, IRow } from '../../../interfaces';
import { useGlobalStore } from '../../../store';
import RelationMatrixHeatMap from './relationMatrixHeatMap';

const Cont = styled.div`
    border: 1px solid #e3e2e2;
    margin: 8px 0px;
    padding: 8px;
    overflow: auto;
`

export enum MATRIX_TYPE {
    mutualInfo = 'mutual_info',
    conditionalMutualInfo = 'conditional_mutual_info',
    causal = 'causal',
}

const MATRIX_PIVOT_LIST = [
    { itemKey: MATRIX_TYPE.mutualInfo, text: 'Mutual Info', taskLabel: 'Compute' },
    { itemKey: MATRIX_TYPE.conditionalMutualInfo, text: 'Conditional Mutual Info', taskLabel: 'Compute' },
    { itemKey: MATRIX_TYPE.causal, text: 'Causal Discovery', taskLabel: 'Causal Discover' },
];
function showMatrix (causalFields: IFieldMeta[], mat: number[][], computing?: boolean): boolean {
    return causalFields.length > 0 && mat.length > 0 && causalFields.length === mat.length && !computing;
}
interface MatrixPanelProps {
    onMatrixPointClick?: (xFid: string, yFid: string) => void;
    fields: IFieldMeta[];
    dataSource: IRow[];
    onCompute: (type: MATRIX_TYPE) => void;
}
const MatrixPanel: React.FC<MatrixPanelProps> = (props) => {
    const { onMatrixPointClick, fields, onCompute, dataSource } = props;
    const [selectedKey, setSelectedKey] = useState(MATRIX_TYPE.mutualInfo);
    const { causalStore } = useGlobalStore();
    const { computing, igCondMatrix, igMatrix, causalStrength } = causalStore;

    useEffect(() => {
        causalStore.computeIGMatrix(dataSource, fields);
    }, [dataSource, fields, causalStore]);

    return (
        <Cont>
            <Pivot
                style={{ marginBottom: '1em' }}
                selectedKey={selectedKey}
                onLinkClick={(item) => {
                    item && setSelectedKey(item.props.itemKey as MATRIX_TYPE);
                }}
            >
                {MATRIX_PIVOT_LIST.map((item) => {
                    return <PivotItem key={item.itemKey} headerText={item.text} itemKey={item.itemKey} />;
                })}
            </Pivot>
            <PrimaryButton
                style={{ marginBottom: '1em' }}
                text={MATRIX_PIVOT_LIST.find((item) => item.itemKey === selectedKey)?.taskLabel}
                onClick={() => { onCompute(selectedKey) }}
            />
            <div>
            {selectedKey === MATRIX_TYPE.mutualInfo && showMatrix(fields, igMatrix, computing) && (
                <RelationMatrixHeatMap
                    absolute
                    fields={fields}
                    data={igMatrix}
                    onSelect={onMatrixPointClick}
                />
            )}
            {selectedKey === MATRIX_TYPE.conditionalMutualInfo && showMatrix(fields, igCondMatrix, computing) && (
                <RelationMatrixHeatMap
                    absolute
                    fields={fields}
                    data={igCondMatrix}
                    onSelect={onMatrixPointClick}
                />
            )}
            {selectedKey === MATRIX_TYPE.causal && showMatrix(fields, causalStrength, computing) && (
                <RelationMatrixHeatMap
                    absolute
                    fields={fields}
                    data={igCondMatrix}
                    onSelect={onMatrixPointClick}
                />
            )}
            {computing && <Spinner label="computing" />}
            </div>
        </Cont>
    );
};

export default observer(MatrixPanel);
