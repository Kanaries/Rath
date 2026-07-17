import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { Fragment, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { cn } from 'utils/cn';
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
`;

const StepHeader = styled.div`
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 1rem;
    padding: 0.5em 0;
    border-bottom: 1px solid var(--border);
`;

const StepHint = styled.p<{ isCurrentStep: boolean }>`
    font-size: 0.8rem;
    opacity: ${({ isCurrentStep }) => (isCurrentStep ? 0.8 : 0.6)};
    padding: 0.6em 0;
    display: flex;
    align-items: center;
    gap: 0.4em;
    flex-grow: 0;
    flex-shrink: 0;
`;

const StepList = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    min-width: 0;
    overflow-x: auto;
`;

const StepConnector = styled.span`
    width: 28px;
    height: 1px;
    flex: none;
    background: var(--border);
    margin: 0 0.25em;
`;

const StepPanel = styled.div`
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

    const curStepIndex = allCausalSteps.indexOf(curStep.key);

    const goPreviousStep = curStepIndex > 0 ? () => setStepKey(allCausalSteps[curStepIndex - 1]) : undefined;
    const goNextStep =
        curStep.key === CausalStep.DATASET_CONFIG
            ? () => setStepKey(CausalStep.CAUSAL_MODEL)
            : curStepIndex < allCausalSteps.length - 1
            ? () => setStepKey(allCausalSteps[curStepIndex + 1])
            : undefined;

    return (
        <Container>
            <StepHeader>
                <h1 className="text-base font-semibold">{intl.get('menu.causal')}</h1>
                <StepList role="list">
                    {CausalSteps.map((step, i) => {
                        const active = step.key === stepKey;
                        const completed = i < curStepIndex;
                        return (
                            <Fragment key={step.key}>
                                {i !== 0 && <StepConnector aria-hidden="true" />}
                                <div
                                    role="listitem"
                                    aria-current={active ? 'step' : undefined}
                                    tabIndex={active ? undefined : 0}
                                    className={cn(
                                        'flex items-center gap-2 whitespace-nowrap rounded-md px-2 py-1 text-sm',
                                        active ? 'font-semibold' : 'cursor-pointer text-muted-foreground hover:bg-accent hover:text-foreground'
                                    )}
                                    onClick={() => active || setStepKey(step.key)}
                                    onKeyDown={(e) => {
                                        if (!active && (e.key === 'Enter' || e.key === ' ')) {
                                            e.preventDefault();
                                            setStepKey(step.key);
                                        }
                                    }}
                                    onMouseOver={() => active || setShowHelp(step.key)}
                                    onMouseOut={() => setShowHelp(stepKey)}
                                >
                                    <span
                                        aria-hidden="true"
                                        className={cn(
                                            'inline-flex h-5 w-5 flex-none items-center justify-center rounded-full text-[11px] font-semibold',
                                            active
                                                ? 'bg-foreground text-background'
                                                : completed
                                                ? 'bg-primary/15 text-primary'
                                                : 'border-[1.5px] border-border text-muted-foreground'
                                        )}
                                    >
                                        {completed ? <RathIcon name="CheckMark" size={11} strokeWidth={3} /> : i + 1}
                                    </span>
                                    <span>{step.title}</span>
                                </div>
                            </Fragment>
                        );
                    })}
                </StepList>
                <div className="flex justify-end gap-2">
                    <Button className="gap-1.5" variant="outline" disabled={!goPreviousStep} onClick={goPreviousStep}>
                        <RathIcon name="ChevronLeft" />
                        {intl.get('causal.actions.prev_step')}
                    </Button>
                    <Button className="gap-1.5" disabled={!goNextStep} onClick={goNextStep}>
                        {intl.get('causal.actions.continue')}
                        <RathIcon name="ChevronRight" />
                    </Button>
                </div>
            </StepHeader>
            <StepHint isCurrentStep={hintStep.key === stepKey}>
                <RathIcon name={hintStep.key === stepKey ? 'Info' : 'InfoSolid'} />
                {hintStep.help}
            </StepHint>
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
