import { DefaultButton, Icon, IconButton } from "@fluentui/react";
import { observer } from "mobx-react-lite";
import { Fragment, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { getI18n } from "../locales";
import CausalDatasetConfig from './datasetConfig';
import CausalFDConfig from './functionalDependencies';
import CausalModel from "./causalModal";


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

const StepItem = styled.div<{ active: boolean; completed: boolean }>`
    padding: 0 1em;
    cursor: ${({ active }) => active ? 'default' : 'pointer'};
    font-weight: ${({ active }) => active ? 500 : 400};
    opacity: ${({ active, completed }) => active || completed ? 1 : 0.5};
    :hover {
        opacity: ${({ active, completed }) => active || completed ? 1 : 0.75};
    }
    position: relative;
`;

const Badge = styled.div`
    position: absolute;
    right: 0;
    top: 0;
    transform: translate(50%, -30%);
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
    FD_CONFIG = 'fd_config',
    CAUSAL_MODEL = 'causal_model',
}

export type CausalStepOption = {
    key: CausalStep;
    title: string;
    help: string;
};

export const CausalSteps: readonly CausalStep[] = [
    CausalStep.DATASET_CONFIG,
    CausalStep.FD_CONFIG,
    CausalStep.CAUSAL_MODEL,
];

export const CausalStepPager = observer(function CausalStepPager () {
    const [stepKey, setStepKey] = useState<CausalStep>(CausalStep.DATASET_CONFIG);
    const [showHelp, setShowHelp] = useState<CausalStep>(stepKey);

    useEffect(() => {
        setShowHelp(stepKey);
    }, [stepKey]);

    const [skipFDEdit, setSkipFDEdit] = useState(true);

    const goPreviousStep = useMemo(() => {
        switch (stepKey) {
            case CausalStep.DATASET_CONFIG: {
                return undefined;
            }
            case CausalStep.FD_CONFIG: {
                return () => setStepKey(CausalStep.DATASET_CONFIG);
            }
            case CausalStep.CAUSAL_MODEL: {
                return () => setStepKey(CausalStep.FD_CONFIG);
            }
            default: {
                return undefined;
            }
        }
    }, [stepKey]);

    const goNextStep = useMemo(() => {
        switch (stepKey) {
            case CausalStep.DATASET_CONFIG: {
                return () => setStepKey(skipFDEdit ? CausalStep.CAUSAL_MODEL : CausalStep.FD_CONFIG);
            }
            case CausalStep.FD_CONFIG: {
                return () => setStepKey(CausalStep.CAUSAL_MODEL);
            }
            case CausalStep.CAUSAL_MODEL: {
                return undefined;
            }
            default: {
                return undefined;
            }
        }
    }, [stepKey, skipFDEdit]);

    return (
        <Container>
            <StepHeader>
                <DefaultButton disabled={!goPreviousStep} onClick={goPreviousStep} iconProps={{ iconName: 'Previous' }}>
                    {getI18n('step_control.prev')}
                </DefaultButton>
                <StepList>
                    {CausalSteps.map((step, i, arr) => {
                        const active = step === stepKey;
                        const completed = arr.slice(i + 1).some(opt => opt === stepKey);
                        return (
                            <Fragment key={step}>
                                {i !== 0 && (
                                    <span>{'>'}</span>
                                )}
                                <StepItem
                                    active={active}
                                    completed={completed}
                                    onClick={() => active || setStepKey(step)}
                                    onMouseOver={() => active || setShowHelp(step)}
                                    onMouseOut={() => setShowHelp(stepKey)}
                                >
                                    <span>{getI18n(`step.${step}.title`)}</span>
                                    {step === CausalStep.FD_CONFIG && (
                                        <Badge>
                                            <IconButton
                                                title={getI18n('step_control.bypass')}
                                                iconProps={{ iconName: "DoubleChevronRight", style: { fontWeight: 'bold' } }}
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    setSkipFDEdit(!skipFDEdit);
                                                }}
                                                aria-checked={skipFDEdit}
                                                styles={{ root: { transform: 'scale(0.6)', background: skipFDEdit ? undefined : 'linear-gradient(135deg, transparent 47%, #000 47%, #000 53%, transparent 53%)', border: '1px solid', borderRadius: '50%' } }}
                                            />
                                        </Badge>
                                    )}
                                </StepItem>
                            </Fragment>
                        );
                    })}
                </StepList>
                <DefaultButton primary disabled={!goNextStep} onClick={goNextStep} iconProps={{ iconName: 'Next' }}>
                    {getI18n('step_control.next')}
                </DefaultButton>
            </StepHeader>
            <StepHint isCurrentStep={showHelp === stepKey}>
                <Icon iconName={showHelp === stepKey ? "Info" : "InfoSolid"} />
                {getI18n(`step.${showHelp}.description`)}
            </StepHint>
            <hr className="card-line" />
            <StepPanel>
                {{
                    [CausalStep.DATASET_CONFIG]: <CausalDatasetConfig />,
                    [CausalStep.FD_CONFIG]: (
                        <CausalFDConfig />
                    ),
                    [CausalStep.CAUSAL_MODEL]: (
                        <CausalModel />
                    ),
                }[stepKey]}
            </StepPanel>
        </Container>
    );
});
