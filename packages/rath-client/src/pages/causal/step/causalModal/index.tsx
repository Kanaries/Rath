import { DefaultButton, Dropdown, Pivot, PivotItem, PrimaryButton, Spinner, Stack } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import { FC, RefObject, useCallback, useRef, useState } from 'react';
import styled from 'styled-components';
import type { IFieldMeta } from '../../../../interfaces';
import { useGlobalStore } from '../../../../store';
import { useCausalViewContext } from '../../../../store/causalStore/viewStore';
import type { EdgeAssert } from '../../../../store/causalStore/modelStore';
import Explorer from '../../explorer';
import Submodule, { Subtree } from '../../submodule';
import { getI18n } from '../../locales';
import MatrixPanel from '../../matrixPanel';
import ModelStorage from './modelStorage';
import Params from './params';


const Container = styled.div`
    flex-grow: 1;
    flex-shrink: 1;
    display: flex;
    flex-direction: row;
    overflow: hidden;
    > div {
        height: 100%;
        flex-shrink: 1;
        flex-basis: 0;
        overflow: auto;
        padding: 0 1em;
        &.main {
            flex-grow: 1;
        }
    }
`;

const Aside = styled.div<{ size: "big" | "small" }>`
    border-left: 1px solid #8882;
    display: flex;
    flex-direction: row;
    overflow: hidden;
    position: relative;
    flex-grow: ${({ size }) => size === 'big' ? 1.6 : 0.4};
    > div {
        height: 100%;
        &.resizer {
            position: absolute;
            left: 0;
            top: 0;
            flex-grow: 0;
            flex-shrink: 0;
            width: 10px;
            cursor: ${({ size }) => size === 'big' ? 'e-resize' : 'w-resize'};
            outline: none;
            :hover {
                background-color: #8882;
            }
        }
        &:not(.resizer) {
            flex-grow: 1;
            flex-shrink: 1;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
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

const VIEW_LABELS: readonly VIEW_TYPE[] = [VIEW_TYPE.matrix, VIEW_TYPE.diagram];

export enum MATRIX_TYPE {
    mutualInfo = 'mutual_info',
    conditionalMutualInfo = 'conditional_mutual_info',
    causal = 'causal',
}

export const MATRIX_PIVOT_LIST: readonly MATRIX_TYPE[] = [
    MATRIX_TYPE.mutualInfo,
    MATRIX_TYPE.conditionalMutualInfo,
    MATRIX_TYPE.causal,
];

export const CausalMainChart = observer<{
    allowEdit: boolean;
    listenerRef?: RefObject<{ onSubtreeSelected?: (subtree: Subtree | null) => void }>;
}>(function CausalMainChart ({
    allowEdit,
    listenerRef,
}) {
    const { causalStore } = useGlobalStore();

    const viewContext = useCausalViewContext();

    const handleLasso = useCallback((fields: IFieldMeta[]) => {
        for (const f of fields) {
            viewContext?.toggleNodeSelected(f.fid);
        }
    }, [viewContext]);

    const handleSubTreeSelected = useCallback((subtree: Subtree | null) => {
        listenerRef?.current?.onSubtreeSelected?.(subtree);
    }, [listenerRef]);

    const handleLinkTogether = useCallback((srcFid: string, tarFid: string, assert: EdgeAssert) => {
        causalStore.model.addEdgeAssertion(srcFid, tarFid, assert);
    }, [causalStore]);

    const handleRevertLink = useCallback((srcFid: string, tarFid: string) => {
        causalStore.model.revertEdgeAssertion([srcFid, tarFid]);
    }, [causalStore]);

    const handleRemoveLink = useCallback((srcFid: string, tarFid: string) => {
        causalStore.model.removeEdgeAssertion([srcFid, tarFid]);
    }, [causalStore]);

    return (
        <Explorer
            allowEdit={allowEdit}
            onLinkTogether={handleLinkTogether}
            onRevertLink={handleRevertLink}
            onRemoveLink={handleRemoveLink}
            handleLasso={handleLasso}
            handleSubTreeSelected={handleSubTreeSelected}
        />
    );
});

const CausalModal: FC = () => {
    const { causalStore } = useGlobalStore();
    
    const viewContext = useCausalViewContext();

    const appendFields2Group = useCallback((fidArr: string[]) => {
        for (const fid of fidArr) {
            viewContext?.selectNode(fid);
        }
    }, [viewContext]);

    const onFieldGroupSelect = useCallback((xFid: string, yFid: string) => {
        appendFields2Group([xFid, yFid]);
    }, [appendFields2Group]);

    const listenerRef = useRef<{ onSubtreeSelected?: (subtree: Subtree | null) => void }>({});

    const [rightAsideSize, setRightAsideSize] = useState<'small' | 'big'>('small');
    const [viewType, setViewType] = useState<VIEW_TYPE>(VIEW_TYPE.diagram);
    const [selectedKey, setSelectedKey] = useState(MATRIX_TYPE.causal);

    const { tasks, taskIdx, serverActive } = causalStore.operator;
    const task = tasks.at(taskIdx);
    const busy = task?.status === 'PENDING' || task?.status === 'RUNNING';

    return (
        <Container>
            <div className="main">
                <Stack tokens={{ childrenGap: '1em' }} horizontal style={{ marginTop: '1em' }}>
                    <ModelStorage />
                    <Params />
                </Stack>
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
                            text={getI18n(`matrix.${selectedKey}.action`)}
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
                                if (causalStore.operator.busy) {
                                    return;
                                }
                                switch (selectedKey) {
                                    case MATRIX_TYPE.conditionalMutualInfo:
                                        causalStore.computeCondMutualMatrix();
                                        break;
                                    case MATRIX_TYPE.causal:
                                        causalStore.run();
                                        break;
                                    case MATRIX_TYPE.mutualInfo:
                                    default:
                                        causalStore.computeMutualMatrix();
                                        break;
                                }
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
                </Stack>
                {selectedKey === MATRIX_TYPE.causal && (
                    <Dropdown
                        options={VIEW_LABELS.map((key) => ({ key, text: getI18n(`viewType.${key}`) }))}
                        label={getI18n('viewType.label')}
                        selectedKey={viewType}
                        onChange={(e, op) => {
                            op && setViewType(op.key as VIEW_TYPE);
                        }}
                        style={{ width: '250px' }}
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
                    <MatrixPanel
                        selectedKey={selectedKey}
                        onMatrixPointClick={onFieldGroupSelect}
                    />
                )}
                {viewType === VIEW_TYPE.diagram && selectedKey === MATRIX_TYPE.causal && (
                    busy ? <Spinner label={getI18n('computing')} /> : (
                        <CausalMainChart
                            allowEdit
                            listenerRef={listenerRef}
                        />
                    )
                )}
            </div>
            <Aside size={rightAsideSize}>
                <div
                    className="resizer"
                    role="button"
                    tabIndex={0}
                    onClick={() => setRightAsideSize(rightAsideSize === 'big' ? 'small' : 'big')}
                />
                <Submodule ref={listenerRef} />
            </Aside>
        </Container>
    );
};

export default observer(CausalModal);
