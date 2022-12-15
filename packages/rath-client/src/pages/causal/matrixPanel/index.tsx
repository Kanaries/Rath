import { DefaultButton, Dropdown, Pivot, PivotItem, PrimaryButton, Spinner, Stack } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import { FC, useState } from 'react';
import styled from 'styled-components';
import type { IFieldMeta } from '../../../interfaces';
import { useGlobalStore } from '../../../store';
import { getI18n } from '../locales';
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

const ProgressContainer = styled.div`
    padding: 0 0 2px;
    display: inline-block;
    width: max-content;
    position: relative;
    background-size: 100% 2px;
    background-repeat: no-repeat;
    background-position: bottom;
    ::before {
        content: "";
        display: block;
        position: absolute;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        background-image: linear-gradient(to right, #fff2, #fffc 35%, #fffb 38%, #fff0 46%);
        background-size: 400% 100%;
        background-repeat: repeat-x;
        animation: scrolling 8s linear infinite;
        @keyframes scrolling {
            from {
                background-position: 400% 0;
            }
            to {
                background-position: 0 0;
            }
        }
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

const MATRIX_PIVOT_LIST: readonly MATRIX_TYPE[] = [
    MATRIX_TYPE.mutualInfo,
    MATRIX_TYPE.conditionalMutualInfo,
    MATRIX_TYPE.causal,
];

const VIEW_LABELS: readonly VIEW_TYPE[] = [VIEW_TYPE.matrix, VIEW_TYPE.diagram];

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
    const { causalStore } = useGlobalStore();
    const { fields } = causalStore;
    const { mutualMatrix, condMutualMatrix, causalityRaw } = causalStore.model;
    const { serverActive, tasks, taskIdx } = causalStore.operator;
    const task = tasks.at(taskIdx);
    const busy = task?.status === 'PENDING' || task?.status === 'RUNNING';

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
                {MATRIX_PIVOT_LIST.map((key) => {
                    return <PivotItem key={key} headerText={getI18n(`matrix.${key}.name`)} itemKey={key} />;
                })}
            </Pivot>
            <Stack style={{ marginBottom: '1em' }} tokens={{ childrenGap: 10 }}>
                <ProgressContainer
                    style={{
                        backgroundImage: selectedKey === MATRIX_TYPE.causal && busy ? `linear-gradient(to right,
                            #0078d4 ${0.5 + task.progress * 99.5}%,
                            #cdd6d880 ${0.5 + task.progress * 99.5}%
                        )` : undefined,
                    }}
                >
                    <PrimaryButton
                        text={getI18n(`matrix.${MATRIX_PIVOT_LIST.find((key) => key === selectedKey)!}.action`)}
                        onRenderText={(props, defaultRenderer) => {
                            return (
                                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }} >
                                    {busy && <Spinner style={{ transform: 'scale(0.75)' }} />}
                                    {defaultRenderer?.(props)}
                                </div>
                            );
                        }}
                        disabled={busy || (selectedKey === MATRIX_TYPE.causal && !serverActive)}
                        onClick={() => {
                            if (busy) {
                                return;
                            }
                            onCompute(selectedKey);
                        }}
                        iconProps={busy ? undefined : { iconName: 'Rerun' }}
                        style={{ width: 'max-content', transition: 'width 400ms' }}
                    />
                </ProgressContainer>
                {selectedKey === MATRIX_TYPE.causal && tasks.length > 0 && (
                    <Stack tokens={{ childrenGap: 10 }} horizontal>
                        <Dropdown
                            options={tasks.map(task => ({ key: task.taskId, text: `(${task.status} ${(task.progress * 100).toFixed(0)}%) ${task.taskId}` }))}
                            selectedKey={tasks[taskIdx]?.taskId}
                            onChange={(_, op) => op && causalStore.operator.switchTask(op.key as string)}
                            style={{ width: '14em' }}
                        />
                        {tasks[taskIdx]?.taskId && (
                            <DefaultButton
                                text={getI18n('task.reload')}
                                onClick={() => causalStore.operator.retryTask(tasks[taskIdx].taskId)}
                            />
                        )}
                    </Stack>
                )}
                {selectedKey === MATRIX_TYPE.causal && (
                    <Dropdown
                        options={VIEW_LABELS.map((key) => ({ key, text: getI18n(`viewType.${key}`) }))}
                        label={getI18n('viewType.label')}
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
            {busy && <Spinner label={getI18n('computing')} />}
            </div>
        </Cont>
    );
};

export default observer(MatrixPanel);
