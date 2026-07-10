import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { FC, useState } from 'react';
import styled from 'styled-components';
import { Button } from '../../../components/ui/button';
import { Spinner } from '../../../components/ui/spinner';
import { Tabs, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { RathIcon } from '../../../components/icons';
import { RathSelect } from '../../../components/rath-ui/rath-select';
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
    { itemKey: MATRIX_TYPE.causal, text: MATRIX_TYPE.causal, taskLabel: MATRIX_TYPE.causal, icon: 'Relationship' },
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

    const viewOptions = VIEW_LABELS.map((opt) => ({
        key: opt.key,
        text: intl.get(`causal.analyze.${opt.text}`),
    }));

    const markOptions = MARK_LABELS.map((opt) => ({
        key: opt.key,
        text: intl.get(`causal.analyze.${opt.text}`),
    }));

    return (
        <Cont>
            <Tabs
                value={selectedKey}
                onValueChange={(value) => {
                    const key = value as MATRIX_TYPE;
                    setSelectedKey(key);
                    setViewType(key === MATRIX_TYPE.causal ? VIEW_TYPE.diagram : VIEW_TYPE.matrix);
                }}
                className="mb-4"
            >
                <TabsList>
                    {MATRIX_PIVOT_LIST.map((item) => {
                        return (
                            <TabsTrigger key={item.itemKey} value={item.itemKey}>
                                {item.icon && <RathIcon name={item.icon} className="mr-1" />}
                                {intl.get(`causal.analyze.${item.text}`)}
                            </TabsTrigger>
                        );
                    })}
                </TabsList>
            </Tabs>
            <div style={{ display: 'grid', gap: 10, marginBottom: '1em' }}>
                <Button
                    disabled={busy}
                    onClick={() => {
                        if (busy) {
                            return;
                        }
                        onCompute(selectedKey);
                    }}
                    style={{ width: 'max-content', transition: 'width 400ms' }}
                >
                    {busy ? <Spinner aria-hidden="true" /> : <RathIcon name="Rerun" />}
                    {intl.get(`causal.actions.${MATRIX_PIVOT_LIST.find((item) => item.itemKey === selectedKey)?.taskLabel}`)}
                </Button>
                {selectedKey === MATRIX_TYPE.causal && (
                    <RathSelect
                        options={viewOptions}
                        label={intl.get('causal.analyze.view')}
                        selectedKey={viewType}
                        onChange={(key) => {
                            setViewType(key as VIEW_TYPE);
                        }}
                        className="flex w-[250px] flex-row items-center gap-4"
                    />
                )}
                {viewType === VIEW_TYPE.matrix && (
                    <RathSelect
                        options={markOptions}
                        label={intl.get('causal.analyze.mark')}
                        selectedKey={markType}
                        onChange={(key) => {
                            setMarkType(key as 'circle' | 'square');
                        }}
                        className="flex flex-row items-center gap-4"
                    />
                )}
            </div>

            <div>
                {selectedKey === MATRIX_TYPE.mutualInfo && mutualMatrix && showMatrix(fields, mutualMatrix, busy) && (
                    <RelationMatrixHeatMap mark={markType} absolute fields={fields} data={mutualMatrix} onSelect={onMatrixPointClick} />
                )}
                {selectedKey === MATRIX_TYPE.conditionalMutualInfo && condMutualMatrix && showMatrix(fields, condMutualMatrix, busy) && (
                    <RelationMatrixHeatMap mark={markType} absolute fields={fields} data={condMutualMatrix} onSelect={onMatrixPointClick} />
                )}
                {selectedKey === MATRIX_TYPE.causal &&
                    (viewType === VIEW_TYPE.diagram
                        ? busy || diagram
                        : causalityRaw &&
                          showMatrix(fields, causalityRaw, busy) && (
                              <DirectionMatrix mark={markType} fields={fields} data={causalityRaw} onSelect={onMatrixPointClick} />
                          ))}
                {busy && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Spinner aria-hidden="true" />
                        <span>computing</span>
                    </div>
                )}
            </div>
        </Cont>
    );
};

export default observer(MatrixPanel);
