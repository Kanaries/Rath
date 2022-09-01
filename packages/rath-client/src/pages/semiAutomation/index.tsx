import React, { useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { ActionButton } from 'office-ui-fabric-react';
import intl from 'react-intl-universal';
import { useGlobalStore } from '../../store';
import Settings from './settings';
import FocusZone from './focusZone';
import PredictZone from './predictZone';
import { throttle } from '../../utils';


const PatternPage: React.FC = () => {
    const focusZoneContainer = useRef<HTMLDivElement>(null);
    const { discoveryMainStore } = useGlobalStore();
    const { 
        fieldMetas,
        dataSource
    } = discoveryMainStore;

    useEffect(() => {
        if (dataSource.length > 1e5) {
            discoveryMainStore.updateSettings('vizAlgo', 'lite')
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fieldMetas, dataSource])



    useEffect(() => {
        const ele = document.querySelector('.main-app-content');
        const callback = throttle((e: Event) => {
            if (focusZoneContainer.current && ele) {
                if (focusZoneContainer.current.offsetTop + focusZoneContainer.current.offsetHeight < ele.scrollTop) {
                    discoveryMainStore.setShowMiniFloatView(true)
                } else {
                    discoveryMainStore.setShowMiniFloatView(false);
                }
            }
        }, 300)
        ele!.addEventListener('scroll', callback)
        return () => {
            if (ele) {
                ele.removeEventListener('scroll', callback);
            }
        }
    }, [discoveryMainStore])

    return <div className="content-container">
        <Settings />
        <div className="card" ref={focusZoneContainer}>
            <ActionButton
                style={{ float: 'right' }}
                iconProps={{ iconName: 'Settings' }}
                ariaLabel={intl.get('common.settings')}
                title={intl.get('common.settings')}
                text={intl.get('common.settings')}
                onClick={() => {
                    discoveryMainStore.setShowSettings(true);
                }}
            />
            <FocusZone />
            {/* <DefaultButton disabled={renderAmount >= specs.length}
                style={{ marginTop: '5px' }}
                text={intl.get('discovery.main.loadMore')}
                onClick={() => {
                    setRenderAmount(a => a + RENDER_BATCH_SIZE)
                }}
            /> */}
        </div>
        <PredictZone />
    </div>
}

export default observer(PatternPage);