import React, { useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { useGlobalStore } from '../../store';
import { throttle } from '../../utils';
import { Card } from '../../components/card';
import Settings from './settings';
import FocusZone from './focusZone';
import PredictZone from './predictZone';

const PatternPage: React.FC = () => {
    const focusZoneContainer = useRef<HTMLDivElement>(null);
    const { semiAutoStore } = useGlobalStore();
    const { fieldMetas, dataSource } = semiAutoStore;

    useEffect(() => {
        if (dataSource.length > 1e5) {
            semiAutoStore.updateSettings('vizAlgo', 'lite');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fieldMetas, dataSource]);

    useEffect(() => {
        const ele = document.querySelector('.main-app-content');
        const callback = throttle((e: Event) => {
            if (focusZoneContainer.current && ele) {
                if (focusZoneContainer.current.offsetTop + focusZoneContainer.current.offsetHeight < ele.scrollTop) {
                    semiAutoStore.setShowMiniFloatView(true);
                } else {
                    semiAutoStore.setShowMiniFloatView(false);
                }
            }
        }, 300);
        ele!.addEventListener('scroll', callback);
        return () => {
            if (ele) {
                ele.removeEventListener('scroll', callback);
            }
        };
    }, [semiAutoStore]);

    return (
        <div className="content-container">
            <Settings />
            <Card ref={focusZoneContainer}>
                <FocusZone />
            </Card>
            <PredictZone />
        </div>
    );
};

export default observer(PatternPage);
