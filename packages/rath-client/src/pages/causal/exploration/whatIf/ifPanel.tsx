import { Icon, IconButton, Slider, Spinner } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import { FC, Fragment, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import type { IFieldMeta } from '../../../../interfaces';
import { useGlobalStore } from '../../../../store';
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
    const { causalStore: { dataset: { fields, groups } } } = useGlobalStore();
    const viewContext = useCausalViewContext();
    const context = useWhatIfContext();

    useEffect(() => {
        context?.clearConditions();
    }, [fields, context]);

    const isFieldInView = useCallback((fid: string) => {
        const fAsRoot = groups.find(group => group.root === fid);
        if (fAsRoot) {
            return false;
        }
        const fAsLeaf = groups.find(group => group.children.includes(fid));
        if (fAsLeaf) {
            return fAsLeaf.expanded;
        }
        return true;
    }, [groups]);

    useEffect(() => {
        if (context && viewContext) {
            let timer: NodeJS.Timeout | null = null;
            const onNodeClick = (node: IFieldMeta) => {
                if (timer) {
                    clearTimeout(timer);
                }
                if (isFieldInView(node.fid)) {
                    timer = setTimeout(() => {
                        if (node.fid in context.conditions) {
                            context.removeCondition(node.fid);
                        } else {
                            context.setCondition(node.fid, 0);
                        }
                    }, 200);
                }
            };
            const onNodeDblClick = () => {
                if (timer) {
                    clearTimeout(timer);
                    timer = null;
                }
            };
            viewContext.addEventListener('nodeClick', onNodeClick);
            viewContext.addEventListener('nodeDoubleClick', onNodeDblClick);
            return () => {
                viewContext.removeEventListener('nodeClick', onNodeClick);
                viewContext.removeEventListener('nodeDoubleClick', onNodeDblClick);
            };
        }
    }, [viewContext, context, isFieldInView]);

    useEffect(() => {
        if (viewContext) {
            const originRenderer = viewContext.onRenderNode;

            const WhatIfRenderer: typeof originRenderer = ({ fid }) => {
                const value = context?.conditions[fid] ?? context?.predication[fid];
                const nor = value === undefined ? 0 : Math.abs(2 / (1 + Math.exp(-value)) - 1);
                return value === undefined ? {} : {
                    subtext: value === 0 ? '(+0)' : `(${value > 0 ? '+' : '-'}${Math.abs(value) > 10 ? '...' : Math.abs(value).toFixed(2)})`,
                    subtextFill: fid in (context?.conditions ?? {}) ? '#000' : value === 0 ? '#888' : `${
                        value > 0 ? '#da3b01' : '#0027b4'
                    }`,
                    style: {
                        fill: fid in (context?.conditions ?? {}) ? '#0000' : value === 0 ? undefined : `${
                            value > 0 ? '#da3b01' : '#0027b4'
                        }${Math.round(nor * 15).toString(16).repeat(2)}`,
                        stroke: value === 0 ? undefined : `${
                            value > 0 ? '#da3b01' : '#0027b4'
                        }`,
                        lineWidth: fid in (context?.conditions ?? {}) ? 2 : 1,
                    },
                };
            };

            viewContext.setNodeRenderer(WhatIfRenderer);
            setTimeout(() => {
                viewContext.graph?.refresh();
            }, 100);

            return () => {
                viewContext.setNodeRenderer(originRenderer);
                setTimeout(() => {
                    viewContext.graph?.refresh();
                }, 100);
            };
        }
    }, [viewContext, context?.conditions, context?.predication]);

    const getFieldName = useCallback((fid: string): string => {
        return fields.find(f => f.fid === fid)?.name ?? fid;
    }, [fields]);

    if (!context) {
        return null;
    }

    const { conditions, predication, busy } = context;

    const others = fields.filter(f => {
        return isFieldInView(f.fid) && !Object.keys(conditions).concat(Object.keys(predication)).includes(f.fid);
    });
    
    return (
        <Container>
            <Table role="grid" aria-colcount={2}>
                {Object.keys(conditions).filter(fid => isFieldInView(fid)).map((fid, i) => {
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
                {Object.keys(predication).filter(fid => isFieldInView(fid)).map((fid, i) => {
                    const value = predication[fid];
                    let nor = value;
                    nor = 1 / (1 + Math.exp(-nor));
                    nor = nor * 4 - 2;
                    const shadowSize = 2 + Math.abs(nor) * 4;
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
                                    valueFormat={() => `${value < 0 ? '-' : '+'}${Math.abs(value) > 10 ? '...' : Math.abs(value).toFixed(2)}`}
                                    showValue
                                    originFromZero
                                    styles={{
                                        thumb: {
                                            boxShadow: nor === 0 ? undefined : `0 0 ${shadowSize}px ${shadowSize * 0.67}px ${nor > 0 ? '#da3b01' : '#0027b4'}`,
                                        },
                                    }}
                                />
                            </div>
                        </Fragment>
                    );
                })}
                {others.map(({ fid }, i) => {
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
