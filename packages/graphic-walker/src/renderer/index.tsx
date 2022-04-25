import { runInAction, toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { useCallback } from 'react';
import { useGlobalStore } from '../store';
import ReactVega from '../vis/react-vega';

const ReactiveRenderer: React.FC = props => {
    const { vizStore, commonStore } = useGlobalStore();
    const { draggableFieldState, visualConfig } = vizStore;
    const { geoms, interactiveScale, defaultAggregated, defaultStack, showActions } = visualConfig;
    const { currentDataset } = commonStore;

    const rows = toJS(draggableFieldState.rows)
    const columns = toJS(draggableFieldState.columns)
    const color = toJS(draggableFieldState.color)
    const opacity = toJS(draggableFieldState.opacity)
    const size = toJS(draggableFieldState.size)

    const onGeomClick = useCallback((values: any, e: any) => {
        runInAction(() => {
            commonStore.showEmbededMenu([e.pageX, e.pageY])
            commonStore.setFilters(values);
        })
    }, [])

    return <ReactVega
        interactiveScale={interactiveScale}
        geomType={geoms[0]}
        defaultAggregate={defaultAggregated}
        defaultStack={defaultStack}
        dataSource={currentDataset.dataSource}
        rows={rows}
        columns={columns}
        color={color[0]}
        opacity={opacity[0]}
        size={size[0]}
        onGeomClick={onGeomClick}
        showActions={showActions}
    />
}

export default observer(ReactiveRenderer);
