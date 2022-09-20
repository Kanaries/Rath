import { runInAction, toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import { Resizable } from 're-resizable';
import React from 'react';
import { useMemo } from 'react';
import { useCallback } from 'react';
import { useGlobalStore } from '../store';
import ReactVega from '../vis/react-vega';

const ReactiveRenderer: React.FC = props => {
    const { vizStore, commonStore } = useGlobalStore();
    const { draggableFieldState, visualConfig } = vizStore;
    const { geoms, interactiveScale, defaultAggregated, defaultStack, showActions, size } = visualConfig;
    const { currentDataset } = commonStore;
    const { filters } = draggableFieldState;

    const rows = toJS(draggableFieldState.rows)
    const columns = toJS(draggableFieldState.columns)
    const color = toJS(draggableFieldState.color)
    const opacity = toJS(draggableFieldState.opacity)
    const shape = toJS(draggableFieldState.shape)
    const theta = toJS(draggableFieldState.theta)
    const radius = toJS(draggableFieldState.radius)
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

    // apply filters
    const { dataSource } = currentDataset;
    
    const data = useMemo(() => {
        // TODO: 放到 worker 里去做
        return dataSource.filter(which => {
            for (const { rule, fid } of filters) {
                if (!rule) {
                    continue;
                }

                switch (rule.type) {
                    case 'one of': {
                        if (rule.value.has(which[fid])) {
                            break;
                        } else {
                            return false;
                        }
                    }
                    case 'range': {
                        if (rule.value[0] <= which[fid] && which[fid] <= rule.value[1]) {
                            break;
                        } else {
                            return false;
                        }
                    }
                    case 'temporal range': {
                        try {
                            const time = new Date(which[fid]).getTime();

                            if (
                                rule.value[0] <= time && time <= rule.value[1]
                            ) {
                                break;
                            } else {
                                return false;
                            }
                        } catch (error) {
                            console.error(error);

                            return false;
                        }
                    }
                    default: {
                        console.warn('Unresolvable filter rule', rule);
                        continue;
                    }
                }
            }

            return true;
        });
    }, [filters, dataSource]);

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
        dataSource={data}
        rows={rows}
        columns={columns}
        color={color[0]}
        theta={theta[0]}
        radius={radius[0]}
        shape={shape[0]}
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
