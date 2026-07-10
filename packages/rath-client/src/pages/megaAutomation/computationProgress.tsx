import React, { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { Progress } from '../../components/ui/progress';
import { getStateInStorage, setStateInStorage } from '../../workers/engine/utils';
import { useGlobalStore } from '../../store';

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
        <div>
            {computing && (
                <div className="space-y-2 text-sm text-muted-foreground">
                    <div>{`${intl.get('megaAuto.computing')}: ${pn > 0 ? Math.round(pn * 100) + '%' : ''}`}</div>
                    <Progress value={pn > 0 ? pn * 100 : 0} />
                </div>
            )}
        </div>
    );
};

export default observer(ComputationProgress);
