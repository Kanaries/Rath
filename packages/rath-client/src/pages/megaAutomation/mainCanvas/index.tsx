import { Spinner } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import type { FC, Ref } from 'react';
import ReactVega, { IReactVegaHandler } from '../../../components/react-vega';
import VisErrorBoundary from '../../../components/visErrorBoundary';
import { IResizeMode } from '../../../interfaces';
import { useGlobalStore } from '../../../store';
import { LoadingLayer } from '../../semiAutomation/components';
import ResizeContainer from '../resizeContainer';

const MainCanvas: FC<{ handler?: Ref<IReactVegaHandler> }> = ({ handler }) => {
    const { megaAutoStore, ltsPipeLineStore } = useGlobalStore();
    const { mainViewSpec, dataSource, visualConfig } = megaAutoStore;
    const { rendering } = ltsPipeLineStore;
    return (
        <div className="insight-viz">
            {rendering && (
                <LoadingLayer>
                    <Spinner label="Rendering..." />
                </LoadingLayer>
            )}
            {mainViewSpec && (
                <ResizeContainer
                    enableResize={
                        visualConfig.resize === IResizeMode.control &&
                        !(mainViewSpec.encoding.column || mainViewSpec.encoding.row)
                    }
                >
                    <VisErrorBoundary>
                        <ReactVega ref={handler} dataSource={dataSource} spec={mainViewSpec} actions={visualConfig.debug} />
                    </VisErrorBoundary>
                </ResizeContainer>
            )}
        </div>
    );
};

export default observer(MainCanvas);
