import React from 'react';
import { IECStatus } from '../interfaces';
import { ENGINE_CONNECTION_STAGES } from '../constants';
import { Box, Step, StepLabel, Stepper } from '@material-ui/core';

interface ConnectionStatusProps {
    status: IECStatus;
}
const ConnectionStatus: React.FC<ConnectionStatusProps> = props => {
    const { status } = props;
    return <div style={{ margin: '2em 0em 1em 0em' }}>
        <Box sx={{ width: '100%' }}>
        <Stepper alternativeLabel>
            {ENGINE_CONNECTION_STAGES.map((stage) => {
                const currentStage = ENGINE_CONNECTION_STAGES.findIndex((s) => s.name === status);
                return <Step key={stage.name + stage.stage} completed={currentStage >= stage.stage} active={currentStage >= stage.stage} style={{ textAlign: 'center'}}>
                        <StepLabel>{stage.name}</StepLabel>
                        <p>{stage.description}</p>
                    </Step>
                    }
                )}
        </Stepper>
        </Box>
    </div>
}

export default ConnectionStatus;
