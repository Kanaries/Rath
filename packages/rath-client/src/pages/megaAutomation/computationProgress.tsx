import React, { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { ProgressIndicator } from '@fluentui/react';
import { getStateInStorage, setStateInStorage } from '../../workers/engine/utils';

interface CPProps {
    computing: boolean;
}
const ComputationProgress: React.FC<CPProps> = (props) => {
    const { computing } = props;

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
        <div>
            {computing && (
                <ProgressIndicator
                    description={`${intl.get('lts.computing')}: ${pn > 0 ? Math.round(pn * 100) + '%' : ''}`}
                    percentComplete={pn > 0 ? pn : undefined}
                />
            )}
        </div>
    );
};

export default ComputationProgress;
