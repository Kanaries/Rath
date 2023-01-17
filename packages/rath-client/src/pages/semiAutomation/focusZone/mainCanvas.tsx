import { observer } from 'mobx-react-lite';
import { Resizable } from 're-resizable';
import React, { RefObject, useMemo } from 'react';
import { applyFilters, IPattern } from '@kanaries/loa';
import ReactVega, { IReactVegaHandler } from '../../../components/react-vega';
import { IResizeMode, IRow, IVegaSubset } from '../../../interfaces';
import { useGlobalStore } from '../../../store';
import ErrorBoundary from '../../../components/visErrorBoundary';

interface MainCanvasProps {
    view: IPattern;
    spec: IVegaSubset;
    handler?: RefObject<IReactVegaHandler>;
}
const MainCanvas: React.FC<MainCanvasProps> = (props) => {
    const { view, spec, handler } = props;
    const { semiAutoStore, commonStore, dataSourceStore } = useGlobalStore();
    const { mainVizSetting } = semiAutoStore;
    const { cleanedData: dataSource } = dataSourceStore;

    const { resize, debug } = mainVizSetting;
    const { width, height, mode } = resize;
    const viewData = useMemo<IRow[]>(() => {
        if (view) return applyFilters(dataSource, view.filters);
        return [];
    }, [dataSource, view]);

    const enableResize = mode === IResizeMode.control && spec.encoding && !spec.encoding.column && !spec.encoding.row;

    if (enableResize) {
        return (
            <Resizable
                style={{ border: '2px #1890ff dashed' }}
                size={{
                    width: width + 20,
                    height: height + 20,
                }}
                onResizeStop={(e, dir, ref, d) => {
                    semiAutoStore.updateMainVizSettings((s) => {
                        s.resize.width = s.resize.width + d.width;
                        s.resize.height = s.resize.height + d.height;
                    });
                }}
            >
                <ErrorBoundary>
                    <ReactVega ref={handler} actions={debug} spec={spec} dataSource={viewData} config={commonStore.themeConfig} />
                </ErrorBoundary>
            </Resizable>
        );
    }
    return (
        <ErrorBoundary>
            <ReactVega ref={handler} actions={debug} spec={spec} dataSource={viewData} config={commonStore.themeConfig} />
        </ErrorBoundary>
    );
};

export default observer(MainCanvas);
