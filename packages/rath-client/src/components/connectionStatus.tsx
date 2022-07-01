import React from 'react';
import { IECStatus } from '../interfaces';
import styled from 'styled-components';
import { ENGINE_CONNECTION_STAGES } from '../constants';

const Cont = styled.div`
    display: flex;
    justify-content: center;
    padding: 1em;
    margin-top: 1em;
    .block{
        display: flex;
        align-items: center;
        .stage {
            .circle {
                border-color: pink;
                border-width: 2px;
                border-radius: 16px;
                width: 32px;
                height: 32px;
            }
            .title{

            }
            .success {
                border-color: #1890ff;
            }
            .fail {
                border-color: #fa541c;
            }
        }
        .stage-divider{
            height: 2px;
            border-top: 2px dashed #d9d9d9;
            width: 10em;
            margin: 0px 20px;
            /* margin: 15px 12px; */
        }
    }
`

interface ConnectionStatusProps {
    status: IECStatus;
}
const ConnectionStatus: React.FC<ConnectionStatusProps> = props => {
    const { status } = props;
    return <Cont>
        {
            ENGINE_CONNECTION_STAGES.map((stage, index) => {
                const currentStage = ENGINE_CONNECTION_STAGES.findIndex((s) => s.name === status);
                return <div className="block" key={stage.name + stage.stage}>
                    <div className="stage">
                        <div className={`${currentStage >= stage.stage ? 'success' : 'fail'} circle`}></div>
                        <div className="title">{stage.name}</div>
                    </div>
                    { index !== ENGINE_CONNECTION_STAGES.length - 1 && <div className="stage-divider"></div> }
                </div>
            })
        }
    </Cont>
}

export default ConnectionStatus;
