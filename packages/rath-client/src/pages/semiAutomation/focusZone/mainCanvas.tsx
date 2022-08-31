import { observer } from 'mobx-react-lite';
import { Resizable } from 're-resizable';
import React, { useMemo } from 'react';
import ReactVega from '../../../components/react-vega';
import { IPattern } from '@kanaries/loa';
import { IResizeMode, IRow, IVegaSubset } from '../../../interfaces';
import { useGlobalStore } from '../../../store';
import { applyFilter } from '../utils';

interface MainCanvasProps{
    view: IPattern;
    spec: IVegaSubset;
}
const MainCanvas: React.FC<MainCanvasProps> = props => {
    const { view, spec } = props;
    const { discoveryMainStore } = useGlobalStore()
    const { mainVizSetting, dataSource } = discoveryMainStore;

    const { resize, debug } = mainVizSetting
    const { width, height, mode } = resize;
    const viewData = useMemo<IRow[]>(() => {
        if (view) return applyFilter(dataSource, view.filters)
        return []
    }, [dataSource, view])

    const enableResize = (mode === IResizeMode.control && spec.encoding && !spec.encoding.column && !spec.encoding.row)

    if (enableResize) {
        return <Resizable style={{ border: '2px #1890ff dashed'}}
            size={{
                width: width + 20,
                height: height + 20
            }}
            onResizeStop={(e, dir, ref, d) => {
                discoveryMainStore.updateMainVizSettings(s => {
                    s.resize.width = s.resize.width + d.width;
                    s.resize.height = s.resize.height + d.height
                })
        }}>
            <ReactVega
                actions={debug}
                spec={spec}
                dataSource={viewData}
            />
        </Resizable>
    }
    return <ReactVega
        actions={debug}
        spec={spec}
        dataSource={viewData}
    />
}

export default observer(MainCanvas);
