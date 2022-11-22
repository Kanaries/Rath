import { DefaultButton, Spinner } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import produce from 'immer';
import { useGlobalStore } from '../../../store';
import type { ModifiableBgKnowledge } from '../config';
import type { PreconditionPanelProps } from './preconditionPanel';
import { getGeneratedPreconditionsFromAutoDetection, getGeneratedPreconditionsFromExtInfo } from './utils';
import PreconditionEditor from './preconditionEditor';


const Container = styled.div`
    padding: 1em 0 0.4em;
    > button {
        margin: 0 1em;
        :first-child {
            margin: 0 2em 0 0;
        }
    }
`;

const Mask = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    z-index: 9999;
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #fff8;
    > div {
        box-shadow: 0 0 12px rgba(0, 0, 0, 0.15), 0 0 8px rgba(0, 0, 0, 0.03);
        background-color: #fff;
        padding: 2em;
        > div.container {
            width: 600px;
            > * {
                width: 100%;
            }
        }
    }
`;

enum BatchUpdateMode {
    OVERWRITE_ONLY = 'overwrite-only',
    FILL_ONLY = 'fill-only',
    FULLY_REPLACE = 'fully replace',
}

const dropdownOptions: { key: BatchUpdateMode; text: string }[] = [
    {
        key: BatchUpdateMode.OVERWRITE_ONLY,
        text: '更新并替换',//BatchUpdateMode.OVERWRITE_ONLY,
    },
    {
        key: BatchUpdateMode.FILL_ONLY,
        text: '补充不替换',//BatchUpdateMode.FILL_ONLY,
    },
    {
        key: BatchUpdateMode.FULLY_REPLACE,
        text: '全部覆盖',//BatchUpdateMode.FULLY_REPLACE,
    },
];

const PreconditionBatch: React.FC<PreconditionPanelProps> = ({
    context, modifiablePrecondition, setModifiablePrecondition, renderNode,
}) => {
    const { causalStore } = useGlobalStore();
    const { selectedFields } = causalStore;
    const [displayPreview, setDisplayPreview] = useState(false);
    const [preview, setPreview] = useState<ModifiableBgKnowledge[] | null>(null);
    const isPending = displayPreview && preview === null;
    const [mode, setMode] = useState(BatchUpdateMode.OVERWRITE_ONLY);
    const { dataSubset } = context;

    const updatePreview = useMemo<typeof setModifiablePrecondition>(() => {
        if (displayPreview) {
            return setPreview as typeof setModifiablePrecondition;
        }
        return () => {};
    }, [displayPreview]);

    const generatePreconditionsFromExtInfo = useCallback(() => {
        setPreview(getGeneratedPreconditionsFromExtInfo(selectedFields));
        setDisplayPreview(true);
    }, [selectedFields]);

    const pendingRef = useRef<Promise<unknown>>();
    useEffect(() => {
        if (!displayPreview) {
            pendingRef.current = undefined;
        }
    }, [displayPreview]);
    const generatePreconditionsFromAutoDetection = useCallback(() => {
        const p = getGeneratedPreconditionsFromAutoDetection(dataSubset, selectedFields.map(f => f.fid));
        pendingRef.current = p;
        p.then(res => {
            if (p === pendingRef.current) {
                setPreview(res);
            }
        }).catch(err => {
            if (p === pendingRef.current) {
                setPreview([]);
            }
            console.warn(err);
        }).finally(() => {
            pendingRef.current = undefined;
        });
        setDisplayPreview(true);
    }, [selectedFields, dataSubset]);

    const handleClear = useCallback(() => {
        setModifiablePrecondition([]);
    }, [setModifiablePrecondition]);

    const submittable = useMemo<ModifiableBgKnowledge[]>(() => {
        if (preview) {
            switch (mode) {
                case BatchUpdateMode.OVERWRITE_ONLY: {
                    return preview.reduce<ModifiableBgKnowledge[]>((links, link) => {
                        const overloadIdx = links.findIndex(
                            which => [which.src, which.tar].every(node => [link.src, link.tar].includes(node))
                        );
                        if (overloadIdx !== -1) {
                            return produce(links, draft => {
                                draft.splice(overloadIdx, 1, link);
                            });
                        }
                        return links.concat([link]);
                    }, modifiablePrecondition);
                }
                case BatchUpdateMode.FILL_ONLY: {
                    return preview.reduce<ModifiableBgKnowledge[]>((links, link) => {
                        const alreadyDefined = links.find(
                            which => [which.src, which.tar].every(node => [link.src, link.tar].includes(node))
                        );
                        if (!alreadyDefined) {
                            return links.concat([link]);
                        }
                        return links;
                    }, modifiablePrecondition);
                }
                case BatchUpdateMode.FULLY_REPLACE: {
                    return preview;
                }
                default: {
                    return modifiablePrecondition;
                }
            }
        } else {
            return modifiablePrecondition;
        }
    }, [preview, modifiablePrecondition, mode]);
    
    const handleSubmit = useCallback(() => {
        setModifiablePrecondition(submittable);
        setDisplayPreview(false);
        setPreview(null);
    }, [setModifiablePrecondition, submittable]);

    const handleCancel = useCallback(() => {
        setPreview(null);
        setDisplayPreview(false);
    }, []);

    return (
        <>
            <h2>批量修改</h2>
            <Container>
                <DefaultButton onClick={handleClear}>
                    全部删除
                </DefaultButton>
                <DefaultButton onClick={generatePreconditionsFromExtInfo}>
                    使用扩展字段计算图
                </DefaultButton>
                <DefaultButton disabled>
                    导入影响关系
                </DefaultButton>
                <DefaultButton disabled>
                    导入因果模型
                </DefaultButton>
                <DefaultButton onClick={generatePreconditionsFromAutoDetection}>
                    自动识别
                </DefaultButton>
            </Container>
            {displayPreview && (
                <Mask>
                    <div>
                        <div className="container">
                            {isPending ? (
                                <Spinner label="computing" />
                            ) : (
                                <PreconditionEditor
                                    title="预览"
                                    context={context}
                                    modifiablePrecondition={submittable}
                                    setModifiablePrecondition={updatePreview}
                                    renderNode={renderNode}
                                />
                            )}
                        </div>
                        <DefaultButton
                            text={dropdownOptions.find(opt => opt.key === mode)?.text ?? '确定'}
                            onClick={handleSubmit}
                            primary
                            split
                            menuProps={{
                                items: dropdownOptions,
                                onItemClick: (_e, item) => {
                                    if (item) {
                                        setMode(item.key as BatchUpdateMode);
                                    }
                                },
                            }}
                        />
                        <DefaultButton
                            text="取消"
                            onClick={handleCancel}
                        />
                    </div>
                </Mask>
            )}
        </>
    );
};

export default observer(PreconditionBatch);
