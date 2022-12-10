import { Icon, IconButton, Slider, Spinner } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import { FC, Fragment, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import type { IFieldMeta } from '../../../../interfaces';
import { getGlobalStore, useGlobalStore } from '../../../../store';
import { useCausalViewContext } from '../../../../store/causalStore/viewStore';
import { useWhatIfContext } from './context';


const Container = styled.div``;

const Table = styled.div`
    width: 100%;
    display: grid;
    grid-template-columns: max-content auto;
    gap: 0 1em;
    & .readonly {
        pointer-events: none;
    }
    & .hover-to-switch {
        > :first-child {
            display: unset;
        }
        > :not(:first-child) {
            display: none;
        }
        :hover {
            > :first-child {
                display: none;
            }
            > :not(:first-child) {
                display: unset;
            }
        }
    }
    & [role=gridcell][aria-colindex="1"] {
        display: flex;
        align-items: center;
        justify-content: center;
    }
`;

const IfPanel: FC = () => {
    const { causalStore: { dataset: { fields: causalFields } } } = useGlobalStore();
    const viewContext = useCausalViewContext();
    const { localData = null } = viewContext ?? {};
    const { fields: localFields } = localData ?? {};
    const fields = localFields ?? causalFields;
    const context = useWhatIfContext();

    useEffect(() => {
        context?.clearConditions();
    }, [fields, context]);

    useEffect(() => {
        if (context && viewContext) {
            const onNodeClick = (node: IFieldMeta) => {
                if (node.fid in context.conditions) {
                    context.removeCondition(node.fid);
                } else {
                    context.setCondition(node.fid, 0);
                }
            };
            viewContext.addEventListener('nodeClick', onNodeClick);
            return () => {
                viewContext.removeEventListener('nodeClick', onNodeClick);
            };
        }
    }, [viewContext, context]);

    useEffect(() => {
        if (viewContext) {
            const originRenderer = viewContext.onRenderNode;

            const WhatIfRenderer: typeof originRenderer = ({ fid, name }) => {
                const value = context?.conditions[fid] ?? context?.predication[fid];
                const f = getGlobalStore().causalStore.fields.find(which => which.fid === fid);
                const canExpand = f?.semanticType === 'nominal' && !f.extInfo;
                const displayName = name || fid;
                return value === undefined ? {} : {
                    description: value === 0 ? `${displayName} (+0)` : `${displayName} (${value > 0 ? '+' : '-'}${Math.abs(value).toFixed(2)})`,
                    style: {
                        fill: fid in (context?.conditions ?? {}) ? '#0000' : value === 0 ? undefined : `${
                            value > 0 ? '#da3b01' : '#0027b4'
                        }${Math.round(Math.abs(value * 7)).toString(16)}0`,
                        stroke: value === 0 ? undefined : `${
                            value > 0 ? '#da3b01' : '#0027b4'
                        }`,
                        lineWidth: fid in (context?.conditions ?? {}) ? 2 : 1,
                        cursor: canExpand ? 'pointer' : 'default',
                    },
                    labelCfg: {
                        style: {
                            stroke: canExpand ? '#ff8c00' : undefined,
                        },
                    },
                };
            };

            viewContext.setNodeRenderer(WhatIfRenderer);
            viewContext.graph?.update();

            return () => {
                viewContext.setNodeRenderer(originRenderer);
                viewContext.graph?.update();
            };
        }
    }, [viewContext, context, context?.conditions, context?.predication]);

    const getFieldName = useCallback((fid: string): string => {
        return fields.find(f => f.fid === fid)?.name ?? fid;
    }, [fields]);

    if (!context) {
        return null;
    }

    const { conditions, predication, busy } = context;

    return (
        <Container>
            <Table role="grid" aria-colcount={2}>
                {Object.keys(conditions).map((fid, i) => {
                    const value = conditions[fid];
                    return (
                        <Fragment key={fid}>
                            <div role="gridcell" aria-rowindex={i + 1} aria-colindex={1}>
                                <IconButton
                                    iconProps={{ iconName: 'Cancel', style: { color: '#c50f1f' } }}
                                    onClick={() => context.removeCondition(fid)}
                                />
                            </div>
                            <div role="gridcell" aria-rowindex={i + 1} aria-colindex={2}>
                                <Slider
                                    label={getFieldName(fid)}
                                    min={-2}
                                    max={2}
                                    step={1e-2}
                                    value={value}
                                    onChange={(value) => context.setCondition(fid, value)}
                                    showValue
                                    originFromZero
                                    styles={{
                                        thumb: {
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '50%',
                                            top: '-10px',
                                            backgroundColor: value === 0 ? 'transparent' : `${
                                                value > 0 ? '#da3b01' : '#0027b4'
                                            }${Math.round(Math.abs(value * 7)).toString(16)}0`,
                                        },
                                    }}
                                />
                            </div>
                        </Fragment>
                    );
                })}
                {Object.keys(predication).map((fid, i) => {
                    let value = predication[fid];
                    value = 1 / (1 + Math.exp(-value));
                    value = value * 4 - 2;
                    const shadowSize = 2 + Math.abs(value) * 4;
                    return (
                        <Fragment key={fid}>
                            <div role="gridcell" className={busy ? undefined : "hover-to-switch"} aria-rowindex={i + 1 + Object.keys(conditions).length} aria-colindex={1}>
                                {busy ? <Spinner /> : (
                                    <>
                                        <Icon iconName="TriangleSolidRight12" style={{ userSelect: 'none' }} />
                                        <IconButton
                                            iconProps={{ iconName: 'Add' }}
                                            onClick={() => context.setCondition(fid, 0)}
                                        />
                                    </>
                                )}
                            </div>
                            <div role="gridcell" className="readonly" aria-rowindex={i + 1 + Object.keys(conditions).length} aria-colindex={2}>
                                <Slider
                                    key={fid}
                                    label={getFieldName(fid)}
                                    min={-2}
                                    max={2}
                                    step={1e-2}
                                    value={value}
                                    valueFormat={val => val.toFixed(2)}
                                    showValue
                                    originFromZero
                                    styles={{
                                        thumb: {
                                            boxShadow: value === 0 ? undefined : `0 0 ${shadowSize}px ${shadowSize * 0.67}px ${value > 0 ? '#da3b01' : '#0027b4'}`,
                                        },
                                    }}
                                />
                            </div>
                        </Fragment>
                    );
                })}
                {fields.filter(f => !Object.keys(conditions).concat(Object.keys(predication)).includes(f.fid)).map(({ fid }, i) => {
                    return (
                        <Fragment key={fid}>
                            <div role="gridcell" aria-rowindex={i + 1 + Object.keys(conditions).length + Object.keys(predication).length} aria-colindex={1}>
                                <IconButton
                                    iconProps={{ iconName: 'Add' }}
                                    onClick={() => context.setCondition(fid, 0)}
                                />
                            </div>
                            <div role="gridcell" aria-rowindex={i + 1 + Object.keys(conditions).length} aria-colindex={2}>
                                <Slider
                                    key={fid}
                                    label={getFieldName(fid)}
                                    min={-2}
                                    max={2}
                                    step={1e-2}
                                    value={0}
                                    valueFormat={val => val.toFixed(2)}
                                    showValue
                                    originFromZero
                                    disabled
                                />
                            </div>
                        </Fragment>
                    );
                })}
            </Table>
        </Container>
    );
};


export default observer(IfPanel);
