import { Dropdown, Pivot, PivotItem, PrimaryButton, Spinner, Stack } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import { FC, useState } from 'react';
import styled from 'styled-components';
import type { IFieldMeta } from '../../../interfaces';
import { useGlobalStore } from '../../../store';
import DirectionMatrix from './directionMatrix';
import RelationMatrixHeatMap from './relationMatrixHeatMap';

const Cont = styled.div`
    /* border: 1px solid #e3e2e2; */
    flex-grow: 1;
    flex-shrink: 1;
    margin: 8px 0px;
    padding: 8px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    > div:last-child {
        flex-grow: 1;
        flex-shrink: 1;
        overflow: auto;
    }
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
    { key: 'diagram', text: '图（PAG）' },
];

const MARK_LABELS = [
    { key: 'circle', text: '圆形' || 'Circle' },
    { key: 'square', text: '矩形' },
];

function showMatrix(causalFields: readonly IFieldMeta[], mat: readonly (readonly number[])[], computing: boolean): boolean {
    return causalFields.length > 0 && mat.length > 0 && causalFields.length === mat.length && !computing;
}

interface MatrixPanelProps {
    onMatrixPointClick?: (xFid: string, yFid: string) => void;
    onCompute: (type: MATRIX_TYPE) => void;
    diagram?: JSX.Element;
}
const MatrixPanel: FC<MatrixPanelProps> = (props) => {
    const { onMatrixPointClick, onCompute, diagram } = props;
    const [viewType, setViewType] = useState<VIEW_TYPE>(VIEW_TYPE.diagram);
    const [selectedKey, setSelectedKey] = useState(MATRIX_TYPE.causal);
    const [markType, setMarkType] = useState<'circle' | 'square'>('circle');
    const { __deprecatedCausalStore, causalStore } = useGlobalStore();
    const { igCondMatrix } = __deprecatedCausalStore;
    const { fields } = causalStore;
    const { mutualMatrix, causalityRaw } = causalStore.model;
    const { busy } = causalStore.operator;

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
            <Stack style={{ marginBottom: '1em' }} tokens={{ childrenGap: 10 }}>
                <PrimaryButton
                    text={MATRIX_PIVOT_LIST.find((item) => item.itemKey === selectedKey)?.taskLabel}
                    onRenderText={(props, defaultRenderer) => {
                        return (
                            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }} >
                                {busy && <Spinner style={{ transform: 'scale(0.75)' }} />}
                                {defaultRenderer?.(props)}
                            </div>
                        );
                    }}
                    disabled={busy}
                    onClick={() => {
                        if (busy) {
                            return;
                        }
                        onCompute(selectedKey);
                    }}
                    iconProps={busy ? undefined : { iconName: 'Rerun' }}
                    style={{ width: 'max-content', transition: 'width 400ms' }}
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
                            },
                            label: {
                                margin: '0 1em',
                            },
                        }}
                    />
                )}
            </Stack>

            <div>
            {selectedKey === MATRIX_TYPE.mutualInfo && mutualMatrix && showMatrix(fields, mutualMatrix, busy) && (
                <RelationMatrixHeatMap
                    mark={markType}
                    absolute
                    fields={fields}
                    data={mutualMatrix}
                    onSelect={onMatrixPointClick}
                />
            )}
            {selectedKey === MATRIX_TYPE.conditionalMutualInfo && showMatrix(fields, igCondMatrix, busy) && (
                <RelationMatrixHeatMap
                    mark={markType}
                    absolute
                    fields={fields}
                    data={igCondMatrix}
                    onSelect={onMatrixPointClick}
                />
            )}
            {selectedKey === MATRIX_TYPE.causal && (
                viewType === VIEW_TYPE.diagram ? (
                    busy || diagram
                ) : causalityRaw && showMatrix(fields, causalityRaw, busy) && (
                    <DirectionMatrix
                        mark={markType}
                        fields={fields}
                        data={causalityRaw}
                        onSelect={onMatrixPointClick}
                    />
                )
            )}
            {busy && <Spinner label="computing" />}
            </div>
        </Cont>
    );
};

export default observer(MatrixPanel);
