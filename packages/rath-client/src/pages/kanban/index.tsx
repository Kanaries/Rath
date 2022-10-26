import { applyFilters } from '@kanaries/loa';
import styled from 'styled-components';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GridLayout from "react-grid-layout";
import { CommandButton, IconButton, VerticalDivider } from '@fluentui/react';
import { Pagination, Divider } from '@material-ui/core';
import { debounceTime, Subject } from 'rxjs';

import ReactVega from '../../components/react-vega';
import { useGlobalStore } from '../../store';
import VisErrorBoundary from '../../components/visErrorBoundary';
import { IInsightVizView } from '../../interfaces';
import FilterCreationPill from '../../components/filterCreationPill';
import ViewField from '../megaAutomation/vizOperation/viewField';
import { IFilter } from '../../interfaces';

import Empty from './empty';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';


const Segment = styled.div`
    display: flex;
    flex-direction: column;
    overflow: hidden;
    > * {
        flex-grow: 1;
        flex-shrink: 1;
        overflow: hidden;
    }
    & nav > ul {
        display: flex;
        justify-content: space-between;
    }
    height: calc(100vh - 24px);
`;

const CollectContainer = styled.div`
    display: flex;
    overflow: auto hidden;
    flex-grow: 0;
    height: 120px;
    > * {
        flex-shrink: 0;
        margin-right: 10px;
        border: 1px solid rgb(218, 220, 224);
        padding: 10px 12px 0 2px;
        height: max-content;
        position: relative;
        &:last-child: {
            margin-right: 0;
        }
        &.selected {
            opacity: 0.5;
        }
        &.ready {
            cursor: copy;
        }
        > * {
            pointer-events: none;
        }
    }
`;

const ResourceList = styled.div({
    flexGrow: 0,
    flexShrink: 0,
    margin: '0 0.6em 0.8em',
    padding: '0.8em 1em',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#fff',
    boxShadow: '0 1.6px 3.6px 0 rgb(0 0 0 / 13%), 0 0.3px 0.9px 0 rgb(0 0 0 / 11%)',
});

const EditArea = styled.div({
    margin: '0 0.6em 0',
    padding: '1em 1.5em',
    boxSizing: 'content-box',
    height: '80vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#fff',
    boxShadow: '0 1.6px 3.6px 0 rgb(0 0 0 / 13%), 0 0.3px 0.9px 0 rgb(0 0 0 / 11%)',
    overflow: 'auto',
});

const EditItem = styled.div({
    backgroundColor: '#fff',
    // boxShadow: '0 1.6px 3.6px 0 rgb(0 0 0 / 13%), 0 0.3px 0.9px 0 rgb(0 0 0 / 11%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    // overflow: 'hidden',
    '> div.group': {
        position: 'absolute',
        right: 0,
        top: 0,
        opacity: 0,
        display: 'block',
        width: 'max-content',
        height: 'max-content',

        '&.float': {
            left: 0,
        },
    },
    '&:hover > div.group': {
        opacity: 1,
    },
});

const ToolGroup = styled.div({
    margin: '0.8em 0.6em 1.8em',
    padding: '0.4em 0.6em',
    height: 'max-content',
    display: 'flex',
    flexShrink: 0,
    flexDirection: 'row',
    backgroundColor: '#fff',
    boxShadow: '0 1.6px 3.6px 0 rgb(0 0 0 / 13%), 0 0.3px 0.9px 0 rgb(0 0 0 / 11%)',
    overflow: 'hidden',
    '> *:not(:last-child)': {
        marginRight: '1em',
    },
});

const VIEW_NUM_IN_PAGE = 5;

export type KanbanItem = {
    viewId: string;
    layout: {
        x: number;
        y: number;
        w: number;
        h: number;
    };
    chartSize: {
        w: number;
        h: number;
    };
    filter: IFilter[] | boolean;
};

const CANVAS_PADDING = 40;

const Kanban: React.FC = (props) => {
    const { collectionStore, dataSourceStore, dashboardStore } = useGlobalStore();
    const { collectionList } = collectionStore;
    const { cleanedData } = dataSourceStore;

    const [pageIndex, setPageIndex] = useState(0);

    const { items, filters } = dashboardStore.page;
    const pageSize = dashboardStore.pages.length;

    const addItem = useCallback((item: IInsightVizView) => {
        dashboardStore.addItem({
            viewId: item.viewId,
            layout: {
                x: 0,
                y: 0,
                w: 2,
                h: 2,
            },
            chartSize: {
                w: 2 * 100 - 100,
                h: 2 * 100 - 80,
            },
            filter: false,
        });
    }, [dashboardStore]);

    const editAreaRef = useRef<HTMLDivElement>(null);

    const handleDrop = useCallback((layout: GridLayout.Layout[], o: GridLayout.Layout) => {
        const targetIdx = items.findIndex(e => e.viewId === o.i);
        const item = layout.find(d => d.i === o.i);

        if (targetIdx !== -1 && item) {
            dashboardStore.setItem(targetIdx, {
                ...items[targetIdx],
                layout: {
                    x: item.x,
                    y: item.y,
                    w: item.w,
                    h: item.h,
                },
            });
        }
    }, [items, dashboardStore]);

    const handleResize = useCallback((layout: GridLayout.Layout[], o: GridLayout.Layout) => {
        const box = editAreaRef.current?.querySelector(`#item-id-${o.i}`);
        const targetIdx = items.findIndex(e => e.viewId === o.i);
        
        const item = layout.find(d => d.i === o.i);

        if (targetIdx !== -1 && box && item) {
            dashboardStore.setItem(targetIdx, {
                ...items[targetIdx],
                layout: {
                    x: item.x,
                    y: item.y,
                    w: item.w,
                    h: item.h,
                },
                chartSize: {
                    w: box.getBoundingClientRect().width - 100,
                    h: box.getBoundingClientRect().height - 80,
                },
            });
        }
    }, [items, dashboardStore]);

    const toCanvas = useCallback((size = 4): [string, number, number] => {
        const container = editAreaRef.current?.children[0] as undefined | HTMLDivElement;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const items = [...container?.children ?? []] as HTMLDivElement[];

        if (container && items.length > 0 && ctx) {
            const geometries = items.map<[number, number, number, number]>(div => {
                const rect = div.getBoundingClientRect();

                return [
                    rect.left,
                    rect.top,
                    rect.right,
                    rect.bottom,
                ];
            });

            const [x1, y1, x2, y2] = geometries.reduce<[number, number, number, number]>(([x1, y1, x2, y2], geometry) => {                return [
                    Math.min(x1, geometry[0]),
                    Math.min(y1, geometry[1]),
                    Math.max(x2, geometry[2]),
                    Math.max(y2, geometry[3]),
                ];
            }, [
                Infinity, Infinity, -Infinity, -Infinity
            ]);

            const fx = (x: number) => (x - x1 + CANVAS_PADDING) * size;
            const fy = (y: number) => (y - y1 + CANVAS_PADDING) * size;

            const width = ((x2 - x1) + CANVAS_PADDING * 2) * size;
            const height = ((y2 - y1) + CANVAS_PADDING * 2) * size;
            
            canvas.width = width;
            canvas.height = height;
            ctx.fillStyle = '#fff';
            ctx.fillRect(CANVAS_PADDING * size, CANVAS_PADDING * size, (x2 - x1) * size, (y2 - y1) * size);

            items.forEach(div => {
                const c = div.querySelector('canvas');

                if (c) {
                    const rect = c.getBoundingClientRect();
                    const x = fx(rect.left);
                    const y = fy(rect.top);
                    ctx.drawImage(c, 0, 0, c.width, c.height, x, y, rect.width * size, rect.height * size);
                }
            });

            ctx.fillStyle = '#333';
            ctx.fillRect(0, 0, width, CANVAS_PADDING * size);
            ctx.fillRect(0, 0, CANVAS_PADDING * size, height);
            ctx.fillRect(width - CANVAS_PADDING * size, 0, CANVAS_PADDING * size, height);
            ctx.fillRect(0, height - CANVAS_PADDING * size, width, CANVAS_PADDING * size);
        } else {
            canvas.width = 600;
            canvas.height = 400;
        }

        return [canvas.toDataURL('image/png'), canvas.width, canvas.height];
    }, []);

    const open = useCallback(() => {
        const [data, w, h] = toCanvas(8);
        const image = document.createElement('img');
        image.src = data;
        image.width = w / 8;
        image.height = h / 8;
        const preview = window.open("");

        if (preview) {
            preview.document.title = 'dashboard preview';
            preview.document.write(image.outerHTML);
        }
    }, [toCanvas]);
    
    const download = useCallback(() => {
        const [data] = toCanvas(8);
        const a = document.createElement('a');
        a.href = data;
        a.download = 'dashboard';
        a.click();
    }, [toCanvas]);

    const mergeFilters = (index: number, vis: IInsightVizView): IFilter[] => {
        return [
            ...vis.filters,
            ...filters.map(f => f.filter),
            ...items.map((item, i) => {
                return i === index ? [] : typeof item.filter === 'boolean' ? [] : item.filter;
            }).flat(),
        ];
    };

    // console.log(JSON.parse(JSON.stringify(items)), JSON.parse(JSON.stringify(filters)));

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const filter$ = useMemo(() => new Subject<{ index: number; data: IFilter[] }>(), [dashboardStore.page]);

    useEffect(() => {
        const subscription = filter$.pipe(
            debounceTime(200),
        ).subscribe(({ index, data }) => {
            dashboardStore.setItem(index, {
                ...items[index],
                filter: data,
            });
        });

        return () => subscription.unsubscribe();
    }, [filter$, dashboardStore, items]);

    return collectionList.length === 0 ? (
        <Empty />
    ) : (
        <Segment>
            <ResourceList style={{ flexDirection: 'row', alignItems: 'center', padding: '0.8em 0.6em 0.5em' }}>
                <header
                    style={{
                        flexGrow: 0,
                        flexShrink: 0,
                        width: 'unset',
                        marginRight: '1em',
                    }}
                >
                    {'Dashboard'}
                </header>
                <Pagination
                    style={{
                        flexGrow: 1,
                        flexShrink: 1,
                        width: 'unset',
                        marginRight: '1em',
                    }}
                    variant="outlined"
                    shape="rounded"
                    count={pageSize}
                    page={dashboardStore.cursor + 1}
                    onChange={(_, v) => {
                        dashboardStore.setCursor(v - 1);
                    }}
                />
                <CommandButton
                    onClick={() => dashboardStore.newPage()}
                    iconProps={{
                        iconName: 'Add',
                    }}
                />
            </ResourceList>
            <ResourceList>
                <Pagination
                    style={{
                        margin: '0.8em 0.6em 0.5em',
                        width: 'unset',
                    }}
                    variant="outlined"
                    shape="rounded"
                    count={Math.ceil(collectionList.length / VIEW_NUM_IN_PAGE)}
                    page={pageIndex + 1}
                    onChange={(_, v) => {
                        setPageIndex(v - 1);
                    }}
                />
                <Divider style={{ marginBottom: '0.6em', marginTop: '0.6em' }} />
                <CollectContainer>
                    {collectionList.slice(pageIndex * VIEW_NUM_IN_PAGE, (pageIndex + 1) * VIEW_NUM_IN_PAGE).map(item => (
                        <div
                            key={item.viewId}
                            className={items.find(e => e.viewId === item.viewId) ? 'selected' : 'ready'}
                            onClick={() => items.find(e => e.viewId === item.viewId) ? {} : addItem(item)}
                        >
                            <VisErrorBoundary>
                                <ReactVega
                                    dataSource={applyFilters(cleanedData, [...item.filters, ...filters.map(f => f.filter)])}
                                    spec={{
                                        ...item.spec,
                                        width: 120,
                                        height: 50,
                                    }}
                                    actions={false}
                                />
                            </VisErrorBoundary>
                        </div>
                    ))}
                </CollectContainer>
            </ResourceList>
            <ResourceList style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                <header style={{ flexGrow: 0, flexShrink: 0, marginRight: '1em' }}>Filters</header>
                {filters.map((filter, i) => {
                    const targetField = dataSourceStore.fieldMetas.find(m => m.fid === filter.field.fid);
                    if (!targetField) return null;
                    let filterDesc = `${targetField.name || targetField.fid} ∈ `;
                    filterDesc += (filter.filter.type === 'range' ? `[${filter.filter.range.join(',')}]` : `{${filter.filter.values.join(',')}}`)
                    return  (
                        <ViewField
                            key={i}
                            type={targetField.analyticType}
                            text={filterDesc}
                            onRemove={() => {
                                dashboardStore.deleteFilter(i);
                            }}
                        />
                    );
                })}
                <FilterCreationPill
                    fields={dataSourceStore.fieldMetas}
                    onFilterSubmit={(field, filter) => {
                        dashboardStore.addFilter(field, filter);
                    }}
                />
            </ResourceList>
            <EditArea ref={editAreaRef}>
                <GridLayout
                    className="layout"
                    cols={12}
                    width={12 * 100}
                    rowHeight={100}
                    onDrop={handleDrop}
                    onResizeStop={handleResize}
                    style={{
                        width: 12 * 100,
                    }}
                >
                    {items.map((item, i) => {
                        const vis = collectionList.find(e => e.viewId === item.viewId);

                        return vis ? (
                            <EditItem
                                key={item.viewId}
                                id={`item-id-${item.viewId}`}
                                data-grid={{
                                    ...item.layout,
                                    minW: 2,
                                    maxW: 12,
                                    minH: 2,
                                    maxH: 12,
                                    resizeHandles: ['s', 'e', 'se'],
                                }}
                            >
                                <VisErrorBoundary>
                                    <ReactVega
                                        dataSource={applyFilters(cleanedData, mergeFilters(i, vis))}
                                        spec={item.filter ? {
                                            data: vis.spec.data,
                                            layer: [{
                                                params: item.filter ? [{
                                                    name: 'brush',
                                                    value: typeof item.filter === 'object' ? (
                                                        item.filter.length === 2 && item.filter[0].type === 'range' && item.filter[1].type === 'range' ? {
                                                            x: item.filter[0].range,
                                                            y: item.filter[1].range,
                                                        } : undefined
                                                    ) : undefined,
                                                    select: {
                                                        type: 'interval',
                                                        // encodings: ['x'],
                                                    },
                                                }] : undefined,
                                                mark: vis.spec.mark,
                                                encoding: vis.spec.encoding,
                                                width: item.chartSize.w,
                                                height: item.chartSize.h,
                                            }, {
                                                transform: [{
                                                    filter: { param: 'brush' },
                                                }],
                                                mark: vis.spec.mark,
                                                encoding: {
                                                    ...vis.spec.encoding,
                                                    color: { value: 'goldenrod' },
                                                },
                                                width: item.chartSize.w,
                                                height: item.chartSize.h,
                                            }],
                                            width: item.chartSize.w,
                                            height: item.chartSize.h,
                                        } : {
                                            ...vis.spec,
                                            width: item.chartSize.w,
                                            height: item.chartSize.h,
                                        }}
                                        actions={false}
                                        signalHandler={item.filter ? {
                                            // brush_tuple: (name: 'brush_tuple', value: { fields: { field: string }[], values: [number, number][] }) => {
                                            //     const filter = value.fields.map<IFilter | null>(({ field: name }, i) => {
                                            //         const f = dataSourceStore.fieldMetas.find(f => f.name === name);

                                            //         return f ? {
                                            //             type: 'range',
                                            //             fid: f.fid,
                                            //             range: [
                                            //                 Math.min(...value.values[i]),
                                            //                 Math.max(...value.values[i]),
                                            //             ],
                                            //         } : null;
                                            //     }).filter(Boolean) as IFilter[];

                                            //     dashboardStore.setItem(i, {
                                            //         ...item,
                                            //         filter,
                                            //     });
                                            // },
                                            brush: (name: 'brush', filters: {
                                                [name: string]: [number, number];
                                            }) => {
                                                const filter = Object.entries(filters).map<IFilter | null>(([k, v]) => {
                                                    const f = dataSourceStore.fieldMetas.find(f => f.name === k);

                                                    return f ? {
                                                        type: 'range',
                                                        fid: f.fid,
                                                        range: v,
                                                    } : null;
                                                }).filter(Boolean) as IFilter[];

                                                filter$.next({
                                                    index: i,
                                                    data: filter,
                                                });
                                            },
                                        } : undefined}
                                    />
                                </VisErrorBoundary>
                                <div
                                    className="group"
                                    style={{ opacity: item.filter ? 1 : undefined }}
                                    onMouseDown={e => e.stopPropagation()}
                                >
                                    <CommandButton
                                        iconProps={{
                                            iconName: item.filter ? 'FilterSolid' : 'Filter',
                                        }}
                                        onClick={() => {
                                            dashboardStore.setItem(i, {
                                                ...item,
                                                filter: !item.filter,
                                            });
                                        }}
                                    />
                                </div>
                                <div
                                    className="group float"
                                >
                                    <CommandButton
                                        iconProps={{
                                            iconName: 'Move',
                                        }}
                                    />
                                </div>
                            </EditItem>
                        ) : null;
                    })}
                </GridLayout>
            </EditArea>
            <ToolGroup>
                <IconButton
                    onClick={() => dashboardStore.clearPage()}
                    iconProps={{
                        iconName: 'DeleteTable',
                        style: {
                            color: '#fff',
                            backgroundColor: '#c50f1f',
                            padding: '6px',
                            boxSizing: 'content-box',
                            borderRadius: '6px',
                        },
                    }}
                    style={{
                        marginRight: '1.5em',
                    }}
                />
                <VerticalDivider />
                <IconButton
                    disabled={items.length === 0}
                    onClick={open}
                    iconProps={{
                        iconName: 'OpenInNewWindow',
                        style: {
                            color: items.length === 0 ? '#666' : '#fff',
                            backgroundColor: items.length === 0 ? 'unset' : '#4f6bed',
                            padding: '6px',
                            boxSizing: 'content-box',
                            borderRadius: '6px',
                        },
                    }}
                    style={{
                        marginLeft: '1em',
                    }}
                />
                <IconButton
                    disabled={items.length === 0}
                    onClick={download}
                    iconProps={{
                        iconName: 'Download',
                        style: {
                            color:  items.length === 0 ? '#666' : '#fff',
                            backgroundColor: items.length === 0 ? 'unset' : '#546fd2',
                            padding: '6px',
                            boxSizing: 'content-box',
                            borderRadius: '6px',
                        },
                    }}
                />
            </ToolGroup>
        </Segment>
    );
};

export default observer(Kanban);
