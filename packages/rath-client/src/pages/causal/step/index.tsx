import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { Fragment, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Button } from '../../../components/ui/button';
import { RathIcon } from '../../../components/icons';
import CausalDatasetConfig from './datasetConfig';
import CausalFDConfig from './FDConfig';
import CausalModel from './causalModel';

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
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 1rem;
    padding: 1em 0 0;
`;

const StepHint = styled.p<{ isCurrentStep: boolean }>`
    font-size: 0.8rem;
    opacity: ${({ isCurrentStep }) => (isCurrentStep ? 0.8 : 0.6)};
    padding: 1em 0;
    > i {
        margin: 0 2px;
    }
`;

const StepList = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    min-width: 0;
    overflow-x: auto;
    > span {
        margin: 0 0.75em;
        user-select: none;
        pointer-events: none;
        opacity: 0.3;
    }
`;

const StepItem = styled.div<{ active: boolean; completed: boolean }>`
    padding: 0 0.5em;
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    white-space: nowrap;
    cursor: ${({ active }) => (active ? 'default' : 'pointer')};
    font-weight: ${({ active }) => (active ? 500 : 400)};
    opacity: ${({ active, completed }) => (active || completed ? 1 : 0.5)};
    :hover {
        opacity: ${({ active, completed }) => (active || completed ? 1 : 0.75)};
    }
    position: relative;
`;

const Badge = styled.div`
    display: inline-flex;
    align-items: center;
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

const allCausalSteps = [CausalStep.DATASET_CONFIG, CausalStep.FD_CONFIG, CausalStep.CAUSAL_MODEL] as const;

export const CausalStepPager = observer(function CausalStepPager() {
    const [stepKey, setStepKey] = useState<CausalStep>(CausalStep.DATASET_CONFIG);
    const [showHelp, setShowHelp] = useState<CausalStep>(stepKey);

    useEffect(() => {
        setShowHelp(stepKey);
    }, [stepKey]);

    const CausalSteps = useMemo(() => {
        return allCausalSteps.map<CausalStepOption>((step) => ({
            key: step,
            title: intl.get(`causal.analyze.${step}.title`),
            help: intl.get(`causal.analyze.${step}.help`),
        }));
    }, []);

    const curStep = useMemo(() => CausalSteps.find((s) => s.key === stepKey)!, [CausalSteps, stepKey]);
    const hintStep = useMemo(() => CausalSteps.find((s) => s.key === showHelp)!, [CausalSteps, showHelp]);

    const [skipFDEdit, setSkipFDEdit] = useState(true);

    const goPreviousStep = useMemo(() => {
        switch (curStep.key) {
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
    }, [curStep]);

    const goNextStep = useMemo(() => {
        switch (curStep.key) {
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
    }, [curStep, skipFDEdit]);

    return (
        <Container>
            <StepHeader>
                <Button className="gap-1.5" variant="outline" disabled={!goPreviousStep} onClick={goPreviousStep}>
                    <RathIcon name="Previous" />
                    {intl.get('causal.actions.prev_step')}
                </Button>
                <StepList>
                    {CausalSteps.map((step, i, arr) => {
                        const active = step.key === stepKey;
                        const completed = arr.slice(i + 1).some((opt) => opt.key === stepKey);
                        return (
                            <Fragment key={step.key}>
                                {i !== 0 && <span>{'>'}</span>}
                                <StepItem
                                    active={active}
                                    completed={completed}
                                    onClick={() => active || setStepKey(step.key)}
                                    onMouseOver={() => active || setShowHelp(step.key)}
                                    onMouseOut={() => setShowHelp(stepKey)}
                                >
                                    <span>{step.title}</span>
                                    {step.key === CausalStep.FD_CONFIG && (
                                        <Badge>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 rounded-full border"
                                                title="Bypass"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSkipFDEdit(!skipFDEdit);
                                                }}
                                                aria-pressed={skipFDEdit}
                                                style={{
                                                    background: skipFDEdit
                                                        ? undefined
                                                        : 'linear-gradient(135deg, transparent 47%, #000 47%, #000 53%, transparent 53%)',
                                                    border: '1px solid',
                                                    borderRadius: '50%',
                                                }}
                                            >
                                                <RathIcon name="DoubleChevronRight" style={{ fontWeight: 'bold' }} />
                                            </Button>
                                        </Badge>
                                    )}
                                </StepItem>
                            </Fragment>
                        );
                    })}
                </StepList>
                <Button className="gap-1.5" disabled={!goNextStep} onClick={goNextStep}>
                    <RathIcon name="Next" />
                    {intl.get('causal.actions.continue')}
                </Button>
            </StepHeader>
            <StepHint isCurrentStep={hintStep.key === stepKey}>
                <RathIcon name={hintStep.key === stepKey ? 'Info' : 'InfoSolid'} />
                {hintStep.help}
            </StepHint>
            <hr className="card-line" />
            <StepPanel>
                {
                    {
                        [CausalStep.DATASET_CONFIG]: <CausalDatasetConfig />,
                        [CausalStep.FD_CONFIG]: <CausalFDConfig />,
                        [CausalStep.CAUSAL_MODEL]: <CausalModel />,
                    }[curStep.key]
                }
            </StepPanel>
        </Container>
    );
});
