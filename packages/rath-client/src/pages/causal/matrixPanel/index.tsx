import { Dropdown, Pivot, PivotItem, PrimaryButton, Spinner, Stack } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { IFieldMeta, IRow } from '../../../interfaces';
import { useGlobalStore } from '../../../store';
import DirectionMatrix from './directionMatrix';
import RelationMatrixHeatMap from './relationMatrixHeatMap';

const Cont = styled.div`
    border: 1px solid #e3e2e2;
    margin: 8px 0px;
    padding: 8px;
    overflow: auto;
`;

export enum VIEW_TYPE {
    matrix = 'matrix',
    diagram = 'diagram',
}

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

const VIEW_LABELS = [
    { key: 'matrix', text: '矩阵' },
    { key: 'diagram', text: '完全部分有向无环图（CPDAG）' },
];

const MARK_LABELS = [
    { key: 'circle', text: '圆形' || 'Circle' },
    { key: 'square', text: '矩形' },
];

function showMatrix(causalFields: IFieldMeta[], mat: number[][], computing?: boolean): boolean {
    return causalFields.length > 0 && mat.length > 0 && causalFields.length === mat.length && !computing;
}

interface MatrixPanelProps {
    onMatrixPointClick?: (xFid: string, yFid: string) => void;
    fields: IFieldMeta[];
    dataSource: IRow[];
    onCompute: (type: MATRIX_TYPE) => void;
    diagram?: JSX.Element;
}
const MatrixPanel: React.FC<MatrixPanelProps> = (props) => {
    const { onMatrixPointClick, fields, onCompute, dataSource, diagram } = props;
    const [viewType, setViewType] = useState<VIEW_TYPE>(VIEW_TYPE.matrix);
    const [selectedKey, setSelectedKey] = useState(MATRIX_TYPE.causal);
    const [markType, setMarkType] = useState<'circle' | 'square'>('circle');
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
                    if (item) {
                        setSelectedKey(item.props.itemKey as MATRIX_TYPE);
                        setViewType(item.props.itemKey === MATRIX_TYPE.causal ? VIEW_TYPE.diagram : VIEW_TYPE.matrix);
                    }
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
                {selectedKey === MATRIX_TYPE.causal && (
                    <Dropdown
                        options={VIEW_LABELS}
                        label="视图"
                        selectedKey={viewType}
                        onChange={(e, op) => {
                            op && setViewType(op.key as VIEW_TYPE);
                        }}
                        style={{
                            width: '250px',
                        }}
                        styles={{
                            root: {
                                display: 'flex',
                                flexDirection: 'row',
                            },
                            label: {
                                margin: '0 1em',
                            },
                        }}
                    />
                )}
                {viewType === VIEW_TYPE.matrix && (
                    <Dropdown
                        options={MARK_LABELS}
                        label="标记"
                        selectedKey={markType}
                        onChange={(e, op) => {
                            op && setMarkType(op.key as 'circle' | 'square');
                        }}
                        styles={{
                            root: {
                                display: 'flex',
                                flexDirection: 'row',
                                margin: '0 1em',
                            },
                            label: {
                                margin: '0 1em',
                            },
                        }}
                    />
                )}
            </Stack>

            <div>
            {selectedKey === MATRIX_TYPE.mutualInfo && showMatrix(fields, igMatrix, computing) && (
                <RelationMatrixHeatMap
                    mark={markType}
                    absolute
                    fields={fields}
                    data={igMatrix}
                    onSelect={onMatrixPointClick}
                />
            )}
            {selectedKey === MATRIX_TYPE.conditionalMutualInfo && showMatrix(fields, igCondMatrix, computing) && (
                <RelationMatrixHeatMap
                    mark={markType}
                    absolute
                    fields={fields}
                    data={igCondMatrix}
                    onSelect={onMatrixPointClick}
                />
            )}
            {selectedKey === MATRIX_TYPE.causal && showMatrix(fields, causalStrength, computing) && (
                viewType === VIEW_TYPE.diagram ? (
                    diagram
                ) : (
                    <DirectionMatrix
                        mark={markType}
                        fields={fields}
                        data={causalStrength}
                        onSelect={onMatrixPointClick}
                    />
                )
            )}
            {computing && <Spinner label="computing" />}
            </div>
        </Cont>
    );
};

export default observer(MatrixPanel);
