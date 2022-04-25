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

    const rowLeftFacetFields = rows.slice(0, -1).filter(f => f.analyticType === 'dimension');
    const colLeftFacetFields = columns.slice(0, -1).filter(f => f.analyticType === 'dimension');

    const hasFacet = rowLeftFacetFields.length > 0 || colLeftFacetFields.length > 0;
    
    const onGeomClick = useCallback((values: any, e: any) => {
        runInAction(() => {
            commonStore.showEmbededMenu([e.pageX, e.pageY])
            commonStore.setFilters(values);
        })
    }, [])
    console.log(size.width, size.height)
    return <Resizable className={(size.mode === 'fixed' && !hasFacet) ? "border-blue-400 border-2 overflow-hidden" : ""}
    style={{ padding: '12px' }}
    onResizeStop={(e, direction, ref, d) => {
        vizStore.setChartLayout({
            mode: 'fixed',
            width: size.width + d.width,
            height: size.height + d.height
        })
    }}
    size={{
        width: size.width + 'px',
        height: size.height + 'px',
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
        width={size.width - 12 * 4}
        height={size.height - 12 * 4}
    />
    </Resizable>
}

export default observer(ReactiveRenderer);
