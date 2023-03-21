import { Dropdown, Spinner, Stack } from '@fluentui/react';
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

export enum MATRIX_MARK_TYPE {
    circle = 'circle',
    square = 'square',
}

export enum MATRIX_TYPE {
    mutualInfo = 'mutual_info',
    conditionalMutualInfo = 'conditional_mutual_info',
    causal = 'causal_discover',
}

const MARK_LABELS: readonly MATRIX_MARK_TYPE[] = [MATRIX_MARK_TYPE.circle, MATRIX_MARK_TYPE.square];

function showMatrix(causalFields: readonly IFieldMeta[], mat: readonly (readonly number[])[], computing: boolean): boolean {
    return causalFields.length > 0 && mat.length > 0 && causalFields.length === mat.length && !computing;
}

interface MatrixPanelProps {
    onMatrixPointClick?: (xFid: string, yFid: string) => void;
    selectedKey: MATRIX_TYPE;
}
const MatrixPanel: FC<MatrixPanelProps> = (props) => {
    const { onMatrixPointClick, selectedKey } = props;
    const [markType, setMarkType] = useState<MATRIX_MARK_TYPE>(MATRIX_MARK_TYPE.circle);
    const { causalStore } = useGlobalStore();
    const { fields } = causalStore;
    const { mutualMatrix, condMutualMatrix, causalityRaw } = causalStore.model;
    const { tasks, taskIdx } = causalStore.operator;
    const task = tasks.at(taskIdx);
    const busy = task?.status === 'PENDING' || task?.status === 'RUNNING';

    return (
        <Cont>
            <Stack style={{ marginBottom: '1em' }} tokens={{ childrenGap: 10 }}>
                <Dropdown
                    options={MARK_LABELS.map((key) => ({ key, text: getI18n(`matrix.markType.${key}`) }))}
                    label={getI18n('matrix.markType.label')}
                    selectedKey={markType}
                    onChange={(e, op) => {
                        op && setMarkType(op.key as MATRIX_MARK_TYPE);
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
                {selectedKey === MATRIX_TYPE.causal && causalityRaw && showMatrix(fields, causalityRaw, busy) && (
                    <DirectionMatrix
                        mark={markType}
                        fields={fields}
                        data={causalityRaw}
                        onSelect={onMatrixPointClick}
                    />
                )}
                {busy && <Spinner label={getI18n('computing')} />}
            </div>
        </Cont>
    );
};

export default observer(MatrixPanel);
