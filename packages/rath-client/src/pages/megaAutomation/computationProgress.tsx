import React, { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import styled from 'styled-components';
import { ProgressIndicator } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import { getStateInStorage, setStateInStorage } from '../../workers/engine/utils';
import { useGlobalStore } from '../../store';


const Container = styled.div`
    position: absolute;
    left: 0;
    box-sizing: border-box;
    background-color: #fafafa;
    width: 100%;
    padding: 0 3em;
`;

const ComputationProgress: React.FC = () => {
    const { ltsPipeLineStore } = useGlobalStore();
    const { computing } = ltsPipeLineStore;

    const [pn, setPn] = useState<number>(0);

    useEffect(() => {
        setStateInStorage('explore_progress', 0);
    }, []);

    useEffect(() => {
        let int = -1;
        if (computing) {
            int = window.setInterval(() => {
                getStateInStorage('explore_progress').then((v) => {
                    if (typeof v === 'number') {
                        setPn(v);
                    }
                });
            }, 1000);
        }
        return () => {
            if (int !== -1) {
                clearInterval(int);
            }
        };
    }, [computing]);

    return (
        <Container>
            {computing && (
                <ProgressIndicator
                    description={`${intl.get('megaAuto.computing')}: ${pn > 0 ? Math.round(pn * 100) + '%' : ''}`}
                    percentComplete={pn > 0 ? pn : undefined}
                />
            )}
        </Container>
    );
};

export default observer(ComputationProgress);
