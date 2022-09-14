import { observer } from 'mobx-react-lite';
import React from 'react';
import VizOperationBar from '../../components/vizOperationBar';
import { useGlobalStore } from '../../store';
import styled from 'styled-components';

const OpCont = styled.div`
    margin-top: 1em;
`

const OperationBar: React.FC = props => {
    const { semiAutoStore } = useGlobalStore();
    const { mainVizSetting } = semiAutoStore;
    const { interactive, resize, debug } = mainVizSetting;

    return <OpCont>
        <VizOperationBar
            gap={10}
            debug={debug}
            stackLayout="vertical"
            interactive={interactive}
            resizeMode={resize.mode}
            width={resize.width}
            height={resize.height}
            onValueChange={(key, value) => {
                if (key === 'resizeMode') {
                    semiAutoStore.updateMainVizSettings(s => {
                        s.resize.mode = value
                    })
                } else if (key === 'interactive') {
                    semiAutoStore.updateMainVizSettings(s => {
                        s.interactive = value;
                    })
                } else if (key === 'width') {
                    semiAutoStore.updateMainVizSettings(s => {
                        s.resize.width = value
                    })
                } else if (key === 'height') {
                    semiAutoStore.updateMainVizSettings(s => {
                        s.resize.height = value
                    })
                } else if (key === 'debug') {
                    semiAutoStore.updateMainVizSettings(s => {
                        s.debug = value
                    })
                } else if (key === 'nlg') {
                    semiAutoStore.updateMainVizSettings(s => {
                        s.nlg = value
                    })
                }
            }}
        />
        {/* <CommandBar items={cmdOpts} /> */}
    </OpCont>
}

export default observer(OperationBar);
