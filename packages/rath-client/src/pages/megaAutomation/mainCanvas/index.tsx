import { Spinner } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import type { FC, Ref } from 'react';
import ReactVega, { IReactVegaHandler } from '../../../components/react-vega';
import VisErrorBoundary from '../../../components/visErrorBoundary';
import { IResizeMode } from '../../../interfaces';
import { useGlobalStore } from '../../../store';
import { LoadingLayer } from '../../semiAutomation/components';
import ResizeContainer from './resizeContainer';

const MainCanvas: FC<{ handler?: Ref<IReactVegaHandler> }> = ({ handler }) => {
    const { megaAutoStore, ltsPipeLineStore, commonStore, editorStore } = useGlobalStore();
    const { mainView, dataSource, visualConfig, mainViewSpecSource } = megaAutoStore;
    const { muteSpec } = editorStore;
    const { rendering } = ltsPipeLineStore;
    const spec = mainViewSpecSource === 'custom' ? muteSpec : mainView.spec;
    return (
        <div className="insight-viz">
            {rendering && (
                <LoadingLayer>
                    <Spinner label="Rendering..." />
                </LoadingLayer>
            )}
            {mainView.spec && (
                <ResizeContainer
                    enableResize={visualConfig.resize === IResizeMode.control && !(mainView.spec.encoding.column || mainView.spec.encoding.row)}
                >
                    <VisErrorBoundary>
                        <ReactVega ref={handler} dataSource={dataSource} spec={spec} actions={visualConfig.debug} config={commonStore.themeConfig} />
                    </VisErrorBoundary>
                </ResizeContainer>
            )}
        </div>
    );
};

export default observer(MainCanvas);
