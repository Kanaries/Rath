import { DefaultButton, Icon } from "@fluentui/react";
import { observer } from "mobx-react-lite";
import { Fragment, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import type { useDataViews } from "../hooks/dataViews";
import type { ModifiableBgKnowledge } from "../config";
import type { GraphNodeAttributes } from "../explorer/graph-utils";
import type { IFieldMeta } from "../../../interfaces";
import { useGlobalStore } from "../../../store";
import type { useInteractFieldGroups } from "../hooks/interactFieldGroup";
import CausalDatasetConfig from './datasetConfig';
import CausalPreconditionConfig from './preconditionConfig';
import CausalModel from "./causalModel";
import CausalExploration from './exploration';


const Container = styled.div`
    flex-grow: 1;
    flex-shrink: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    > h2 {
        flex-grow: 0;
        flex-shrink: 0;
    }
`;

const StepHeader = styled.div`
    display: flex;
    flex-direction: row;
    padding: 1em 0 0;
`;

const StepHint = styled.p<{ isCurrentStep: boolean }>`
    font-size: 0.8rem;
    opacity: ${({ isCurrentStep }) => isCurrentStep ? 0.8 : 0.6};
    padding: 1em 0;
    > i {
        margin: 0 2px;
    }
`;

const StepList = styled.div`
    display: flex;
    flex-direction: row;
    margin: 0 2em;
    align-items: center;
    > span {
        margin: 0 1.5em;
        user-select: none;
        pointer-events: none;
        opacity: 0.3;
    }
`;

const StepItem = styled.div<{ active: boolean; completed: boolean; inaccessible?: boolean }>`
    padding: 0 1em;
    cursor: ${({ inaccessible, active }) => active ? 'default' : inaccessible ? 'not-allowed' : 'pointer'};
    font-weight: ${({ active }) => active ? 500 : 400};
    opacity: ${({ active, completed }) => active || completed ? 1 : 0.5};
    :hover {
        opacity: ${({ active, completed }) => active || completed ? 1 : 0.75};
    }
`;

const StepPanel = styled.div`
    margin-block: 0.5em;
    flex-grow: 1;
    flex-shrink: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
`;

export enum CausalStep {
    DATASET_CONFIG = 'dataset_config',
    BG_CONFIG = 'bg_config',
    CAUSAL_MODEL = 'causal_model',
    EXPLORATION = 'exploration',
}

export type CausalStepOption = {
    key: CausalStep;
    title: string;
    help: string;
};

export const CausalSteps: readonly CausalStepOption[] = [
    {
        key: CausalStep.DATASET_CONFIG,
        title: '数据集配置',
        help: '从数据中有针对性地选出合适的数据子集以及分析目标关注的因素集合。',
    },
    {
        key: CausalStep.BG_CONFIG,
        title: '编辑条件约束',
        help: '基于特定领域或背景知识定义绝对的条件约束，帮助算法在结论不准确的场景下进行决策。',
    },
    {
        key: CausalStep.CAUSAL_MODEL,
        title: '因果模型',
        help: '选择算法进行因果发现，完善因果图。',
    },
    {
        key: CausalStep.EXPLORATION,
        title: '探索分析',
        help: '在已确认的因果图上结合可视化探索进行结论验证和进一步分析。（需要运行因果发现完成因果模型）',
    },
];

interface CausalStepPagerProps {
    dataContext: ReturnType<typeof useDataViews>;
    modifiablePrecondition: ModifiableBgKnowledge[];
    setModifiablePrecondition: (precondition: ModifiableBgKnowledge[] | ((prev: ModifiableBgKnowledge[]) => ModifiableBgKnowledge[])) => void;
    renderNode: (node: Readonly<IFieldMeta>) => GraphNodeAttributes | undefined;
    interactFieldGroups: ReturnType<typeof useInteractFieldGroups>;
}

export const CausalStepPager = observer<CausalStepPagerProps>(function CausalStepPager ({
    dataContext,
    modifiablePrecondition,
    setModifiablePrecondition,
    renderNode,
    interactFieldGroups,
}) {
    const { causalStore } = useGlobalStore();
    const { causalStrength, selectedFields } = causalStore;
    const [stepKey, setStepKey] = useState<CausalStep>(CausalStep.DATASET_CONFIG);
    const [showHelp, setShowHelp] = useState<CausalStep>(stepKey);

    useEffect(() => {
        setShowHelp(stepKey);
    }, [stepKey]);

    const curStep = useMemo(() => CausalSteps.find(s => s.key === stepKey)!, [stepKey]);
    const hintStep = useMemo(() => CausalSteps.find(s => s.key === showHelp)!, [showHelp]);

    const hasResult = causalStrength.length > 0 && causalStrength.length === selectedFields.length;

    const goPreviousStep = useMemo(() => {
        switch (curStep.key) {
            case CausalStep.DATASET_CONFIG: {
                return undefined;
            }
            case CausalStep.BG_CONFIG: {
                return () => setStepKey(CausalStep.DATASET_CONFIG);
            }
            case CausalStep.CAUSAL_MODEL: {
                return () => setStepKey(CausalStep.BG_CONFIG);
            }
            case CausalStep.EXPLORATION: {
                return () => setStepKey(CausalStep.CAUSAL_MODEL);
            }
            default: {
                return undefined;
            }
        }
    }, [curStep]);

    const goNextStep = useMemo(() => {
        switch (curStep.key) {
            case CausalStep.DATASET_CONFIG: {
                return () => setStepKey(CausalStep.BG_CONFIG);
            }
            case CausalStep.BG_CONFIG: {
                return () => setStepKey(CausalStep.CAUSAL_MODEL);
            }
            case CausalStep.CAUSAL_MODEL: {
                if (hasResult) {
                    return () => setStepKey(CausalStep.EXPLORATION);
                }
                return undefined;
            }
            case CausalStep.EXPLORATION: {
                return undefined;
            }
            default: {
                return undefined;
            }
        }
    }, [curStep, hasResult]);

    return (
        <Container>
            <StepHeader>
                <DefaultButton disabled={!goPreviousStep} onClick={goPreviousStep} iconProps={{ iconName: 'Previous' }}>
                    上一步
                </DefaultButton>
                <StepList>
                    {CausalSteps.map((step, i, arr) => {
                        const active = step.key === stepKey;
                        const completed = arr.slice(i + 1).some(opt => opt.key === stepKey);
                        const inaccessible = step.key === CausalStep.EXPLORATION && !hasResult;
                        return (
                            <Fragment key={step.key}>
                                {i !== 0 && (
                                    <span>{'>'}</span>
                                )}
                                <StepItem
                                    active={active}
                                    completed={completed}
                                    inaccessible={inaccessible}
                                    onClick={() => active || inaccessible || setStepKey(step.key)}
                                    onMouseOver={() => active || setShowHelp(step.key)}
                                    onMouseOut={() => setShowHelp(stepKey)}
                                >
                                    {step.title}
                                </StepItem>
                            </Fragment>
                        );
                    })}
                </StepList>
                <DefaultButton primary disabled={!goNextStep} onClick={goNextStep} iconProps={{ iconName: 'Next' }}>
                    下一步
                </DefaultButton>
            </StepHeader>
            <StepHint isCurrentStep={hintStep.key === stepKey}>
                <Icon iconName={hintStep.key === stepKey ? "Info" : "InfoSolid"} />
                {hintStep.help}
            </StepHint>
            <hr className="card-line" />
            <StepPanel>
                {{
                    [CausalStep.DATASET_CONFIG]: <CausalDatasetConfig dataContext={dataContext} />,
                    [CausalStep.BG_CONFIG]: (
                        <CausalPreconditionConfig
                            dataContext={dataContext}
                            modifiablePrecondition={modifiablePrecondition}
                            setModifiablePrecondition={setModifiablePrecondition}
                            renderNode={renderNode}
                        />
                    ),
                    [CausalStep.CAUSAL_MODEL]: (
                        <CausalModel
                            dataContext={dataContext}
                            modifiablePrecondition={modifiablePrecondition}
                            setModifiablePrecondition={setModifiablePrecondition}
                            renderNode={renderNode}
                            interactFieldGroups={interactFieldGroups}
                        />
                    ),
                    [CausalStep.EXPLORATION]: (
                        <CausalExploration
                            dataContext={dataContext}
                            modifiablePrecondition={modifiablePrecondition}
                            setModifiablePrecondition={setModifiablePrecondition}
                            renderNode={renderNode}
                            interactFieldGroups={interactFieldGroups}
                        />
                    ),
                }[curStep.key]}
            </StepPanel>
        </Container>
    );
});
