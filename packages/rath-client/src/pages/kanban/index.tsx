import { applyFilters } from '@kanaries/loa';
import styled from 'styled-components';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useRef, useState } from 'react';
import GridLayout from "react-grid-layout";
import { IconButton, VerticalDivider } from '@fluentui/react';
import { Pagination, Divider } from '@material-ui/core';

import ReactVega from '../../components/react-vega';
import { useGlobalStore } from '../../store';
import VisErrorBoundary from '../../components/visErrorBoundary';
import { IInsightVizView } from '../../interfaces';
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
    height: 200px;
    > * {
        flex-shrink: 0;
        margin-right: 10px;
        border: 1px solid rgb(218, 220, 224);
        padding: 10px 12px 0 2px;
        height: max-content;
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
    '> div': {
        pointerEvents: 'none',
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

type KanbanItem = {
    viewId: string;
    geometry: {
        x: number;
        y: number;
        w: number;
        h: number;
    };
    size: {
        w: number;
        h: number;
    };
};

const CANVAS_PADDING = 40;

const Kanban: React.FC = (props) => {
    const { collectionStore, dataSourceStore } = useGlobalStore();
    const { collectionList } = collectionStore;
    const { cleanedData } = dataSourceStore;

    const [pageIndex, setPageIndex] = useState<number>(0);

    const [items, setItems] = useState<KanbanItem[]>([]);

    const addItem = useCallback((item: IInsightVizView) => {
        setItems(list => {
            return list.concat([{
                viewId: item.viewId,
                geometry: {
                    x: 0,
                    y: 0,
                    w: 2,
                    h: 2,
                },
                size: {
                    w: 2 * 100 - 100,
                    h: 2 * 100 - 80,
                },
            }]);
        });
    }, []);

    const editAreaRef = useRef<HTMLDivElement>(null);

    const handleDrop = useCallback((layout: GridLayout.Layout[], item: GridLayout.Layout) => {
        const targetIdx = items.findIndex(e => e.viewId === item.i);

        if (targetIdx !== -1) {
            setItems([
                ...items.slice(0, targetIdx),
                {
                    ...items[targetIdx],
                    geometry: {
                        x: item.x,
                        y: item.y,
                        w: item.w,
                        h: item.h,
                    },
                },
                ...items.slice(targetIdx + 1),
            ]);
        }
    }, [items]);

    const handleResize = useCallback((layout: GridLayout.Layout[], item: GridLayout.Layout) => {
        const box = editAreaRef.current?.querySelector(`#item-id-${item.i}`);
        const targetIdx = items.findIndex(e => e.viewId === item.i);

        if (targetIdx !== -1 && box) {
            setItems([
                ...items.slice(0, targetIdx),
                {
                    ...items[targetIdx],
                    geometry: {
                        x: item.x,
                        y: item.y,
                        w: item.w,
                        h: item.h,
                    },
                    size: {
                        w: box.getBoundingClientRect().width - 100,
                        h: box.getBoundingClientRect().height - 80,
                    },
                },
                ...items.slice(targetIdx + 1),
            ]);
        }
    }, [items]);

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

    return collectionList.length === 0 ? (
        <Empty />
    ) : (
        <Segment>
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
                                    dataSource={applyFilters(cleanedData, item.filters)}
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
                    {items.map(item => {
                        const vis = collectionList.find(e => e.viewId === item.viewId);

                        return vis ? (
                            <EditItem
                                key={item.viewId}
                                id={`item-id-${item.viewId}`}
                                data-grid={{
                                    ...item.geometry,
                                    minW: 2,
                                    maxW: 6,
                                    minH: 2,
                                    maxH: 6,
                                    resizeHandles: ['s', 'e', 'se'],
                                }}
                            >
                                <VisErrorBoundary>
                                    <ReactVega
                                        dataSource={applyFilters(cleanedData, vis.filters)}
                                        spec={{
                                            ...vis.spec,
                                            width: item.size.w,
                                            height: item.size.h,
                                        }}
                                        actions={false}
                                    />
                                </VisErrorBoundary>
                            </EditItem>
                        ) : null;
                    })}
                </GridLayout>
            </EditArea>
            <ToolGroup>
                <IconButton
                    onClick={() => setItems([])}
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
