import { ActionButton, DefaultButton, Spinner, Stack } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import produce from 'immer';
import { useGlobalStore } from '../../../store';
import type { IFunctionalDep } from '../config';
import type { FDPanelProps } from './FDPanel';
import { getGeneratedFDFromAutoDetection, getGeneratedFDFromExtInfo } from './utils';
import FDEditor from './FDEditor';


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

const FDBatch: React.FC<FDPanelProps> = ({
    context, functionalDependencies, setFunctionalDependencies, renderNode,
}) => {
    const { causalStore } = useGlobalStore();
    const { selectedFields } = causalStore;
    const [displayPreview, setDisplayPreview] = useState(false);
    const [preview, setPreview] = useState<IFunctionalDep[] | null>(null);
    const isPending = displayPreview && preview === null;
    const [mode, setMode] = useState(BatchUpdateMode.OVERWRITE_ONLY);
    const { dataSubset } = context;

    const updatePreview = useMemo<typeof setFunctionalDependencies>(() => {
        if (displayPreview) {
            return setPreview as typeof setFunctionalDependencies;
        }
        return () => {};
    }, [displayPreview]);

    const generateFDFromExtInfo = useCallback(() => {
        setPreview(getGeneratedFDFromExtInfo(selectedFields));
        setDisplayPreview(true);
    }, [selectedFields]);

    const pendingRef = useRef<Promise<unknown>>();
    useEffect(() => {
        if (!displayPreview) {
            pendingRef.current = undefined;
        }
    }, [displayPreview]);
    const generateFDFromAutoDetection = useCallback(() => {
        const p = getGeneratedFDFromAutoDetection(dataSubset, selectedFields.map(f => f.fid));
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
        setFunctionalDependencies([]);
    }, [setFunctionalDependencies]);

    const submittable = useMemo<IFunctionalDep[]>(() => {
        if (preview) {
            switch (mode) {
                case BatchUpdateMode.OVERWRITE_ONLY: {
                    return preview.reduce<IFunctionalDep[]>((deps, dep) => {
                        const overloadIdx = deps.findIndex(which => which.fid === dep.fid);
                        if (overloadIdx !== -1) {
                            return produce(deps, draft => {
                                draft.splice(overloadIdx, 1, dep);
                            });
                        }
                        return deps.concat([dep]);
                    }, functionalDependencies);
                }
                case BatchUpdateMode.FILL_ONLY: {
                    return preview.reduce<IFunctionalDep[]>((deps, dep) => {
                        const overloadIdx = deps.findIndex(which => which.fid === dep.fid);
                        if (overloadIdx !== -1) {
                            return produce(deps, draft => {
                                const overload = draft[overloadIdx];
                                for (const prm of dep.params) {
                                    if (!overload.params.some(p => p.fid === prm.fid)) {
                                        overload.params.push(prm);
                                    }
                                }
                            });
                        }
                        return deps;
                    }, functionalDependencies);
                }
                case BatchUpdateMode.FULLY_REPLACE: {
                    return preview;
                }
                default: {
                    return functionalDependencies;
                }
            }
        } else {
            return functionalDependencies;
        }
    }, [preview, functionalDependencies, mode]);
    
    const handleSubmit = useCallback(() => {
        setFunctionalDependencies(submittable);
        setDisplayPreview(false);
        setPreview(null);
    }, [setFunctionalDependencies, submittable]);

    const handleCancel = useCallback(() => {
        setPreview(null);
        setDisplayPreview(false);
    }, []);

    const submitRef = useRef(setFunctionalDependencies);
    submitRef.current = setFunctionalDependencies;
    const fdRef = useRef(functionalDependencies);
    fdRef.current = functionalDependencies;
    useEffect(() => {
        setTimeout(() => {
            if (fdRef.current.length === 0) {
                const fds = getGeneratedFDFromExtInfo(selectedFields);
                submitRef.current(fds);
            }
        }, 400);
    }, [selectedFields]);

    return (
        <>
            <h3>快捷操作</h3>
            <Stack tokens={{ childrenGap: 10 }} horizontal>
                <ActionButton iconProps={{ iconName: 'Delete' }} onClick={handleClear}>
                    全部删除
                </ActionButton>
                <ActionButton iconProps={{ iconName: 'EngineeringGroup' || 'BranchSearch' }} onClick={generateFDFromExtInfo}>
                    使用扩展字段计算图
                </ActionButton>
                <ActionButton iconProps={{ iconName: 'ConfigurationSolid' }} disabled>
                    导入影响关系
                </ActionButton>
                <ActionButton iconProps={{ iconName: 'FileTemplate' }} disabled>
                    导入因果模型
                </ActionButton>
                <ActionButton iconProps={{ iconName: 'HintText' }} disabled onClick={undefined && generateFDFromAutoDetection}>
                    自动识别
                </ActionButton>
            </Stack>
            {displayPreview && (
                <Mask>
                    <div>
                        <div className="container">
                            {isPending ? (
                                <Spinner label="computing" />
                            ) : (
                                <FDEditor
                                    title="预览"
                                    context={context}
                                    functionalDependencies={submittable}
                                    setFunctionalDependencies={updatePreview}
                                    renderNode={renderNode}
                                />
                            )}
                        </div>
                        <Stack tokens={{ childrenGap: 20 }} horizontal style={{ justifyContent: 'center' }}>
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
                        </Stack>
                    </div>
                </Mask>
            )}
        </>
    );
};

export default observer(FDBatch);
