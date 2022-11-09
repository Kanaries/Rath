import { Dropdown, Pivot, PivotItem, PrimaryButton, Spinner, Stack } from '@fluentui/react';
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
`;

export enum MATRIX_TYPE {
    mutualInfo = 'mutual_info',
    conditionalMutualInfo = 'conditional_mutual_info',
    causal = 'causal',
}

const MATRIX_PIVOT_LIST = [
    { itemKey: MATRIX_TYPE.mutualInfo, text: '关联信息' || 'Mutual Info', taskLabel: '计算' || 'Compute' },
    {
        itemKey: MATRIX_TYPE.conditionalMutualInfo,
        text: '条件关联信息' || 'Conditional Mutual Info',
        taskLabel: '计算' || 'Compute',
    },
    { itemKey: MATRIX_TYPE.causal, text: '因果发现' || 'Causal Discovery', taskLabel: '因果发现' || 'Causal Discover', iconName: 'Relationship' },
];

const MARK_LABELS = [
    { key: 'circle', text: '圆形' || 'Circle' },
    { key: 'rect', text: '矩形' },
];

function showMatrix(causalFields: IFieldMeta[], mat: number[][], computing?: boolean): boolean {
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
    const [markType, setMarkType] = useState<'circle' | 'rect'>('circle');
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
                    return <PivotItem key={item.itemKey} headerText={item.text} itemKey={item.itemKey} itemIcon={item.iconName} />;
                })}
            </Pivot>
            <Stack style={{ marginBottom: '1em' }} tokens={{ childrenGap: 10 }} horizontal>
                <PrimaryButton
                    text={MATRIX_PIVOT_LIST.find((item) => item.itemKey === selectedKey)?.taskLabel}
                    onClick={() => {
                        onCompute(selectedKey);
                    }}
                    iconProps={{ iconName: 'Rerun' }}
                />
                <Dropdown
                    options={MARK_LABELS}
                    selectedKey={markType}
                    onChange={(e, op) => {
                        op && setMarkType(op.key as 'circle' | 'rect');
                    }}
                />
            </Stack>

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
                    fields={fields}
                    data={causalStrength}
                    onSelect={onMatrixPointClick}
                />
            )}
            {computing && <Spinner label="computing" />}
            </div>
        </Cont>
    );
};

export default observer(MatrixPanel);
