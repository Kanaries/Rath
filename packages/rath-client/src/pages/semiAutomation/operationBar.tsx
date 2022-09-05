import { observer } from 'mobx-react-lite';
import React from 'react';
import VizOperationBar from '../../components/vizOperationBar';
import { useGlobalStore } from '../../store';
import styled from 'styled-components';

const OpCont = styled.div`
    margin-top: 1em;
`

const OperationBar: React.FC = props => {
    const { discoveryMainStore } = useGlobalStore();
    const { mainVizSetting } = discoveryMainStore;
    const { interactive, resize, debug, nlg } = mainVizSetting;

    return <OpCont>
        <VizOperationBar
            nlg={nlg}
            gap={10}
            debug={debug}
            stackLayout="vertical"
            interactive={interactive}
            resizeMode={resize.mode}
            width={resize.width}
            height={resize.height}
            onValueChange={(key, value) => {
                if (key === 'resizeMode') {
                    discoveryMainStore.updateMainVizSettings(s => {
                        s.resize.mode = value
                    })
                } else if (key === 'interactive') {
                    discoveryMainStore.updateMainVizSettings(s => {
                        s.interactive = value;
                    })
                } else if (key === 'width') {
                    discoveryMainStore.updateMainVizSettings(s => {
                        s.resize.width = value
                    })
                } else if (key === 'height') {
                    discoveryMainStore.updateMainVizSettings(s => {
                        s.resize.height = value
                    })
                } else if (key === 'debug') {
                    discoveryMainStore.updateMainVizSettings(s => {
                        s.debug = value
                    })
                } else if (key === 'nlg') {
                    discoveryMainStore.updateMainVizSettings(s => {
                        s.nlg = value
                    })
                }
            }}
        />
        {/* <CommandBar items={cmdOpts} /> */}
    </OpCont>
}

export default observer(OperationBar);
