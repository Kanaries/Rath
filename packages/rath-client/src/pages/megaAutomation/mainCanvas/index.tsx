import { Spinner } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import React from 'react';
import ReactVega from '../../../components/react-vega';
import VisErrorBoundary from '../../../components/visErrorBoundary';
import { IResizeMode } from '../../../interfaces';
import { useGlobalStore } from '../../../store';
import { LoadingLayer } from '../../semiAutomation/components';
import ResizeContainer from './resizeContainer';

const MainCanvas: React.FC = () => {
    const { megaAutoStore, ltsPipeLineStore, commonStore, editorStore } = useGlobalStore();
    const { mainViewSpec, dataSource, visualConfig, mainViewSpecSource } = megaAutoStore;
    const { muteSpec } = editorStore;
    const { rendering } = ltsPipeLineStore;
    const spec = mainViewSpecSource === 'custom' ? muteSpec : mainViewSpec;
    return (
        <div className="insight-viz">
            {rendering && (
                <LoadingLayer>
                    <Spinner label="Rendering..." />
                </LoadingLayer>
            )}
            {mainViewSpec && (
                <ResizeContainer
                    enableResize={visualConfig.resize === IResizeMode.control && !(mainViewSpec.encoding.column || mainViewSpec.encoding.row)}
                >
                    <VisErrorBoundary>
                        <ReactVega dataSource={dataSource} spec={spec} actions={visualConfig.debug} config={commonStore.themeConfig} />
                    </VisErrorBoundary>
                </ResizeContainer>
            )}
        </div>
    );
};

export default observer(MainCanvas);
