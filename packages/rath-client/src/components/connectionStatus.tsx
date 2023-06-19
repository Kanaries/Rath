import React from 'react';
import { IECStatus } from '../interfaces';
import { ENGINE_CONNECTION_STAGES } from '../constants';
import Stepper from './stepper';

interface ConnectionStatusProps {
    status: IECStatus;
}
const ConnectionStatus: React.FC<ConnectionStatusProps> = props => {
    const { status } = props;
    return <div style={{ margin: '2em 0em 1em 0em' }}>
        <Stepper.Box>
            <Stepper>
                {ENGINE_CONNECTION_STAGES.map((stage) => {
                    const currentStage = ENGINE_CONNECTION_STAGES.findIndex((s) => s.name === status);
                    return (
                        <Stepper.Step
                            key={stage.name + stage.stage}
                            completed={currentStage >= stage.stage}
                            active={currentStage >= stage.stage}
                            style={{ textAlign: 'center' }}
                        >
                            <Stepper.StepLabel>{stage.name}</Stepper.StepLabel>
                            <p>{stage.description}</p>
                        </Stepper.Step>
                    );
                })}
            </Stepper>
        </Stepper.Box>
    </div>
}

export default ConnectionStatus;
