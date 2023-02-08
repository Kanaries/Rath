import React from 'react';
import { Box, Step, StepLabel, Stepper } from '@material-ui/core';
import intl from 'react-intl-universal';
import type { DatabaseOptions } from './type';

interface StepConfig {
    label: string;
    idx: number;
}

const steps: StepConfig[] = [
    {
        label: 'Connection',
        idx: 0,
    },
    {
        label: 'Focus',
        idx: 1,
    },
    {
        label: 'Preview',
        idx: 2,
    },
    {
        label: 'Fetch',
        idx: 3,
    },
];

interface StageInfo {
    label: string;
    title: string;
    completed: boolean;
    failed: boolean;
    active: boolean;
    desc: string;
}

const getStageInfo = (progress: Readonly<DatabaseOptions>): StageInfo[] => {
    const stages = steps.map<StageInfo>((step, i) => ({
        label: step.label,
        title: intl.get(`dataSource.dbProgress.${i}.label`),
        completed: false,
        failed: false,
        active: false,
        desc: '',
    }));

    const { connectorReady, sourceId, table, preview } = progress;

    let cursorFixed = false;

    if (sourceId.status !== 'resolved') {
        stages[0]!.active = connectorReady ?? false;

        if (connectorReady) {
            stages[0]!.desc = intl.get('dataSource.dbProgress.0.msgRunning');
        }

        cursorFixed = true;
    } else {
        stages[0]!.completed = true;
        stages[0]!.desc = intl.get(`dataSource.dbProgress.0.${sourceId !== null ? 'msgSucceeded' : 'msgFailed'}`);
        stages[0]!.failed = sourceId === null;

        if (stages[0]!.failed) {
            cursorFixed = true;
        }
    }

    if (!cursorFixed) {
        if (table.status !== 'resolved') {
            stages[1]!.active = true;
            stages[1]!.desc = intl.get('dataSource.dbProgress.1.msgRunning');
            cursorFixed = true;
        } else {
            stages[1]!.completed = true;
            stages[1]!.desc = intl.get('dataSource.dbProgress.1.msgSucceeded');
        }
    }

    if (!cursorFixed) {
        if (preview.status !== 'resolved') {
            stages[2]!.active = true;
            stages[2]!.desc = intl.get('dataSource.dbProgress.2.msgRunning');
            cursorFixed = true;
        } else {
            stages[2]!.completed = true;
            stages[2]!.desc = intl.get('dataSource.dbProgress.2.msgSucceeded');
        }
    }

    if (!cursorFixed) {
        stages[3]!.active = true;
        stages[3]!.desc = intl.get('dataSource.dbProgress.3.msgRunning');
        cursorFixed = true;
    }

    return stages;
};

interface ProgressProps {
    progress: Readonly<DatabaseOptions>;
}

const Progress: React.FC<ProgressProps> = ({ progress }) => {
    const stages = getStageInfo(progress);

    return (
        <div style={{ margin: '2em 0em 1em 0em' }}>
            <Box sx={{ width: '100%' }}>
                <Stepper alternativeLabel>
                    {stages.map((stage) => (
                        <Step key={stage.label} completed={stage.completed} active={stage.active} style={{ textAlign: 'center' }}>
                            <StepLabel error={stage.failed}>{stage.title}</StepLabel>
                            <p>{stage.desc}</p>
                        </Step>
                    ))}
                </Stepper>
            </Box>
        </div>
    );
};

export default Progress;
