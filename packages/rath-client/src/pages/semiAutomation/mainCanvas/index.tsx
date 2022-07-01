import { observer } from 'mobx-react-lite';
import { Resizable } from 're-resizable';
import React, { useMemo } from 'react';
import ReactVega from '../../../components/react-vega';
import { IPattern } from '../../../dev';
import { IResizeMode, IRow } from '../../../interfaces';
import { distVis } from '../../../queries/distVis';
import { labDistVis } from '../../../queries/labdistVis';
import { useGlobalStore } from '../../../store';
import { applyFilter } from '../utils';

interface MainCanvasProps{
    pined: IPattern;
}
const MainCanvas: React.FC<MainCanvasProps> = props => {
    const { pined } = props;
    const { discoveryMainStore, dataSourceStore } = useGlobalStore()
    const { settings, mainVizSetting } = discoveryMainStore;
    const { vizAlgo } = settings;
    const { cleanedData } = dataSourceStore;

    const { resize, debug, interactive } = mainVizSetting
    const { width, height, mode } = resize;
    const mainViewData = useMemo<IRow[]>(() => {
        if (pined) return applyFilter(cleanedData, pined.filters)
        return []
    }, [cleanedData, pined])

    const spec = useMemo(() => {
        if (vizAlgo === 'lite') {
            return distVis({
                resizeMode: mode,
                width,
                height,
                pattern: pined,
                interactive
            })
        } else {
            return labDistVis({
                resizeMode: mode,
                pattern: pined,
                width,
                height,
                dataSource: cleanedData
            })
        }
    }, [mode, height, width, interactive, pined, vizAlgo, cleanedData])

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
                dataSource={mainViewData}
            />
        </Resizable>
    }
    return <ReactVega
        actions={debug}
        spec={spec}
        dataSource={mainViewData}
    />
}

export default observer(MainCanvas);
