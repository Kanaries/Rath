import intl from 'react-intl-universal';
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
    causal = 'causal_discover',
}

const MATRIX_PIVOT_LIST = [
    { itemKey: MATRIX_TYPE.mutualInfo, text: MATRIX_TYPE.mutualInfo, taskLabel: 'compute' },
    {
        itemKey: MATRIX_TYPE.conditionalMutualInfo,
        text: MATRIX_TYPE.conditionalMutualInfo,
        taskLabel: 'compute',
    },
    { itemKey: MATRIX_TYPE.causal, text: MATRIX_TYPE.causal, taskLabel: MATRIX_TYPE.causal, iconName: 'Relationship' },
];

const VIEW_LABELS = [
    { key: 'matrix', text: 'matrix' },
    { key: 'diagram', text: 'diagram' },
];

const MARK_LABELS = [
    { key: 'circle', text: 'circle' },
    { key: 'square', text: 'square' },
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
    const { causalStore } = useGlobalStore();
    const { fields } = causalStore;
    const { mutualMatrix, condMutualMatrix, causalityRaw } = causalStore.model;
    const { busy } = causalStore.operator;

    const viewOptions = VIEW_LABELS.map(opt => ({
        key: opt.key,
        text: intl.get(`causal.analyze.${opt.text}`),
    }));

    const markOptions = MARK_LABELS.map(opt => ({
        key: opt.key,
        text: intl.get(`causal.analyze.${opt.text}`),
    }));

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
                    return <PivotItem key={item.itemKey} headerText={intl.get(`causal.analyze.${item.text}`)} itemKey={item.itemKey} itemIcon={item.iconName} />;
                })}
            </Pivot>
            <Stack style={{ marginBottom: '1em' }} tokens={{ childrenGap: 10 }}>
                <PrimaryButton
                    text={intl.get(`causal.actions.${
                        MATRIX_PIVOT_LIST.find((item) => item.itemKey === selectedKey)?.taskLabel
                    }`)}
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
                        options={viewOptions}
                        label={intl.get('causal.analyze.view')}
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
                        options={markOptions}
                        label={intl.get('causal.analyze.mark')}
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
            {selectedKey === MATRIX_TYPE.conditionalMutualInfo && condMutualMatrix && showMatrix(fields, condMutualMatrix, busy) && (
                <RelationMatrixHeatMap
                    mark={markType}
                    absolute
                    fields={fields}
                    data={condMutualMatrix}
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
