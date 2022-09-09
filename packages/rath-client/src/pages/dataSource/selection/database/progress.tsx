import React from 'react';
import { Box, Step, StepLabel, Stepper } from '@material-ui/core';
import type { DatabaseOptions } from '.';


interface StepConfig {
    label: string;
    msgRunning: string;
    msgSucceeded: string;
    msgFailed: string;
}

const steps: StepConfig[] = [
    {
        label: 'Connection',
        msgRunning: 'Trying to connect to host...',
        msgSucceeded: 'Connection succeeded.',
        msgFailed: 'Connection failed.',
    },
    {
        label: 'Link',
        msgRunning: 'Find a table to continue.',
        msgSucceeded: 'Completed.',
        msgFailed: 'Operation failed.',
    },
    {
        label: 'Preview',
        msgRunning: 'Fetching data from the table.',
        msgSucceeded: 'Preview generated.',
        msgFailed: 'Operation failed.',
    },
    {
        label: 'Fetch',
        msgRunning: 'Loading data by submitting the SQL statement.',
        msgSucceeded: 'Succeeded to execute.',
        msgFailed: 'Failed to execute.',
    },
];

interface StageInfo {
    label: string;
    completed: boolean;
    failed: boolean;
    active: boolean;
    desc: string;
}

const getStageInfo = (progress: Readonly<Partial<DatabaseOptions>>): StageInfo[] => {
    const stages = steps.map<StageInfo>(step => ({
        label: step.label,
        completed: false,
        failed: false,
        active: false,
        desc: '',
    }));

    /* eslint-disable @typescript-eslint/no-unused-vars */
    const [
        _0,
        _1,
        sourceId,
        _3,
        _4,
        _5,
        _6,
        _7,
        selectedTable,
        tablePreview,
        _10,
    ] = progress;
    /* eslint-enable @typescript-eslint/no-unused-vars */

    let cursorFixed = false;

    if (sourceId === undefined || sourceId === 'pending') {
        stages[0]!.active = true;
        stages[0]!.desc = steps[0]!.msgRunning;
        cursorFixed = true;
    } else {
        stages[0]!.completed = true;
        stages[0]!.desc = sourceId !== null ? steps[0]!.msgSucceeded : steps[0]!.msgFailed;
        stages[0]!.failed = sourceId === null;
        
        if (stages[0]!.failed) {
            cursorFixed = true;
        }
    }

    if (!cursorFixed) {
        if (selectedTable === undefined) {
            stages[1]!.active = true;
            stages[1]!.desc = steps[1]!.msgRunning;
            cursorFixed = true;
        } else {
            stages[1]!.completed = true;
            stages[1]!.desc = steps[1]!.msgSucceeded;
        }
    }

    if (!cursorFixed) {
        if (tablePreview === undefined || typeof tablePreview === 'string') {
            stages[2]!.active = true;
            stages[2]!.desc = steps[2]!.msgRunning;
            cursorFixed = true;
        } else {
            stages[2]!.completed = true;
            stages[2]!.desc = steps[2]!.msgSucceeded;
        }
    }

    if (!cursorFixed) {
        stages[3]!.active = true;
        stages[3]!.desc = steps[3]!.msgRunning;
        cursorFixed = true;
    }

    return stages;
};

interface ProgressProps {
    progress: Readonly<Partial<DatabaseOptions>>;
}

const Progress: React.FC<ProgressProps> = ({ progress }) => {
    const stages = getStageInfo(progress);

    return (
        <div style={{ margin: '2em 0em 1em 0em' }}>
            <Box sx={{ width: '100%' }}>
                <Stepper alternativeLabel>
                    {
                        stages.map(stage => (
                            <Step
                                key={stage.label}
                                completed={stage.completed}
                                active={stage.active}
                                style={{ textAlign: 'center' }}
                            >
                                <StepLabel error={stage.failed}>
                                    {stage.label}
                                </StepLabel>
                                <p>{stage.desc}</p>
                            </Step>
                        ))
                    }
                </Stepper>
            </Box>
        </div>
    );
}

export default Progress;
