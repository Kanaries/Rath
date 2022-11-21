import { DefaultButton } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import produce from 'immer';
import { useGlobalStore } from '../../../store';
import type { ModifiableBgKnowledge } from '../config';
import type { PreconditionPanelProps } from './preconditionPanel';
import PreconditionGraph from './preconditionGraph';


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
        box-shadow: 0 10px 8px rgba(0, 0, 0, 0.05), 0 4px 3px rgba(0, 0, 0, 0.01);
        background-color: #fff;
        padding: 2em;
        width: 600px;
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
        text: '仅更新',//BatchUpdateMode.OVERWRITE_ONLY,
    },
    {
        key: BatchUpdateMode.FILL_ONLY,
        text: '仅补充',//BatchUpdateMode.FILL_ONLY,
    },
    {
        key: BatchUpdateMode.FULLY_REPLACE,
        text: '全覆盖',//BatchUpdateMode.FULLY_REPLACE,
    },
];

const PreconditionBatch: React.FC<PreconditionPanelProps> = ({
    modifiablePrecondition, setModifiablePrecondition, renderNode,
}) => {
    const { causalStore } = useGlobalStore();
    const { selectedFields } = causalStore;
    const [displayPreview, setDisplayPreview] = useState(false);
    const [preview, setPreview] = useState<ModifiableBgKnowledge[] | null>(null);
    const isPending = displayPreview && preview === null;
    const [mode, setMode] = useState(BatchUpdateMode.OVERWRITE_ONLY);

    const updatePreview = useMemo<typeof setModifiablePrecondition>(() => {
        if (displayPreview) {
            return setPreview as typeof setModifiablePrecondition;
        }
        return () => {};
    }, [displayPreview]);

    const getGeneratedPreconditionsFromExtInfo = useCallback(() => {
        setPreview(
            selectedFields.reduce<ModifiableBgKnowledge[]>((list, f) => {
                if (f.extInfo) {
                    for (const from of f.extInfo.extFrom) {
                        list.push({
                            src: from,
                            tar: f.fid,
                            type: 'directed-must-link',
                        });
                    }
                }
                return list;
            }, [])
        );
        setDisplayPreview(true);
    }, [selectedFields]);

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
                <DefaultButton onClick={getGeneratedPreconditionsFromExtInfo}>
                    使用扩展字段计算图
                </DefaultButton>
                <DefaultButton>
                    从文件导入
                </DefaultButton>
                <DefaultButton>
                    自动识别
                </DefaultButton>
            </Container>
            {/* 预览 TODO: 做弹窗 */}
            {displayPreview && (
                <Mask>
                    <div>
                        {isPending ? (
                            <p>loading...</p>
                        ) : (
                            <PreconditionGraph
                                modifiablePrecondition={submittable}
                                setModifiablePrecondition={updatePreview}
                                renderNode={renderNode}
                            />
                        )}
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
