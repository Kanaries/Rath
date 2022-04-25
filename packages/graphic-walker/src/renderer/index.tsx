import { runInAction, toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import { Resizable } from 're-resizable';
import React from 'react';
import { useCallback } from 'react';
import { useGlobalStore } from '../store';
import ReactVega from '../vis/react-vega';

const ReactiveRenderer: React.FC = props => {
    const { vizStore, commonStore } = useGlobalStore();
    const { draggableFieldState, visualConfig } = vizStore;
    const { geoms, interactiveScale, defaultAggregated, defaultStack, showActions, size } = visualConfig;
    const { currentDataset } = commonStore;

    const rows = toJS(draggableFieldState.rows)
    const columns = toJS(draggableFieldState.columns)
    const color = toJS(draggableFieldState.color)
    const opacity = toJS(draggableFieldState.opacity)
    const sizeChannel = toJS(draggableFieldState.size)

    const onGeomClick = useCallback((values: any, e: any) => {
        runInAction(() => {
            commonStore.showEmbededMenu([e.pageX, e.pageY])
            commonStore.setFilters(values);
        })
    }, [])

    return <Resizable className={size.mode === 'fixed' ? "border-blue-400 border-2" : ""}
    onResizeStop={(e, direction, ref, d) => {
        vizStore.setChartLayout('fixed', size.width + d.width, size.height + d.height)
    }}
    defaultSize={{
        width: size.width,
        height: size.height,
      }}>
        <ReactVega
        layoutMode={size.mode}
        interactiveScale={interactiveScale}
        geomType={geoms[0]}
        defaultAggregate={defaultAggregated}
        defaultStack={defaultStack}
        dataSource={currentDataset.dataSource}
        rows={rows}
        columns={columns}
        color={color[0]}
        opacity={opacity[0]}
        size={sizeChannel[0]}
        onGeomClick={onGeomClick}
        showActions={showActions}
        width={size.width - 20}
        height={size.height - 20}
    />
    </Resizable>
}

export default observer(ReactiveRenderer);
