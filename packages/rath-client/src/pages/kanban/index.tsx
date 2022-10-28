import { applyFilters } from '@kanaries/loa';
import styled from 'styled-components';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GridLayout from "react-grid-layout";
import { CommandButton } from '@fluentui/react';
import { Pagination, Divider } from '@material-ui/core';
import { debounceTime, Subject } from 'rxjs';

import ReactVega from '../../components/react-vega';
import { useGlobalStore } from '../../store';
import VisErrorBoundary from '../../components/visErrorBoundary';
import type { IInsightVizView } from '../../interfaces';
import FilterCreationPill from '../../components/filterCreationPill';
import ViewField from '../megaAutomation/vizOperation/viewField';
import type { IFilter } from '../../interfaces';
import { PIVOT_KEYS } from '../../constants';

import Empty from './empty';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import KanbanChart from './kanban-chart';
import Tools from './tools';


const Segment = styled.div`
    display: flex;
    flex-direction: column;
    overflow: hidden;
    > * {
        flex-grow: 1;
        flex-shrink: 0;
        overflow: hidden;
    }
    & nav > ul {
        display: flex;
        justify-content: space-between;
    }
    height: max-content;
    & .react-resizable-hide {
        pointer-events: none;
        background-color: transparent;
        ::after {
            content: "";
            display: block;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            border: 1px dashed #a10;
            z-index: 1;
            box-shadow: inset 0 0 0.5em #888;
        }
    }
`;

const CollectContainer = styled.div`
    display: flex;
    overflow: auto hidden;
    flex-grow: 0;
    height: 150px;
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

const EditItem = styled.div({
    backgroundColor: '#fff',
    // boxShadow: '0 1.6px 3.6px 0 rgb(0 0 0 / 13%), 0 0.3px 0.9px 0 rgb(0 0 0 / 11%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    // overflow: 'hidden',
    ':hover::after': {
        content: '""',
        display: 'block',
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        border: '1px dashed #888a',
        zIndex: 2,
    },
    '> div.group': {
        position: 'absolute',
        right: 0,
        top: 0,
        opacity: 0,
        width: 'max-content',
        height: 'max-content',
        display: 'flex',
        flexDirection: 'row',
        border: '1px solid #888',
        overflow: 'hidden',
        borderRadius: '4px',
        backdropFilter: 'blur(9999px)',

        '&.float': {
            left: 0,
        },
        '> button': {
            backgroundColor: '#eee',
            width: '1.8em',
            height: '1.8em',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',

            ':hover': {
                backgroundColor: '#fff',
            },
            '> *': {
                flexGrow: 0,
                flexShrink: 0,
            },
        },
    },
    '&:hover > div.group': {
        opacity: 1,
    },
    '& .react-resizable-handle': {
        opacity: 0,
    },
    '&:hover .react-resizable-handle': {
        opacity: 1,
    },
});

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
    boxSizing: 'content-box',
    height: '92vh',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'stretch',
    '> *': {
        flexGrow: 1,
        flexShrink: 1,
        overflow: 'auto',
        backgroundColor: '#fff',
        boxShadow: '0 1.6px 3.6px 0 rgb(0 0 0 / 13%), 0 0.3px 0.9px 0 rgb(0 0 0 / 11%)',
    },
    marginBottom: 'calc(2vh + 1em)',
    overflow: 'hidden',
    boxShadow: '0 1.6px 3.6px 0 rgb(0 0 0 / 13%), 0 0.3px 0.9px 0 rgb(0 0 0 / 11%)',
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

const Kanban: React.FC = () => {
    const { collectionStore, dataSourceStore, dashboardStore, commonStore, semiAutoStore } = useGlobalStore();
    const { collectionList } = collectionStore;
    const { cleanedData, fieldMetas } = dataSourceStore;

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

    const handleLayoutChange = useCallback((layout: GridLayout.Layout[]) => {
        items.forEach((item, i) => {
            const box = editAreaRef.current?.querySelector(`#item-id-${item.viewId}`);
            const self = layout.find(d => d.i === `${dashboardStore.cursor}:${item.viewId}`);
            if (box && self) {
                dashboardStore.setItem(i, {
                    ...item,
                    layout: {
                        x: self.x,
                        y: self.y,
                        w: self.w,
                        h: self.h,
                    },
                    chartSize: {
                        w: box.getBoundingClientRect().width - 100,
                        h: box.getBoundingClientRect().height - 80,
                    },
                });
            }
        });
    }, [items, dashboardStore]);

    const mergeFilters = (index: number, vis: IInsightVizView): IFilter[] => {
        return [
            ...vis.filters,
            ...filters.map(f => f.filter),
            ...items.map((item, i) => {
                return i === index ? [] : typeof item.filter === 'boolean' ? [] : item.filter;
            }).flat(),
        ];
    };

    // console.log(JSON.parse(JSON.stringify(items)), JSON.parse(JSON.stringify(dashboardStore.page)));

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const filter$ = useMemo(() => new Subject<{ index: number; data: IFilter[] }>(), [dashboardStore.page]);

    useEffect(() => {
        const whichPage = dashboardStore.cursor;

        const subscription = filter$.pipe(
            debounceTime(200),
        ).subscribe(({ index, data }) => {
            if (whichPage !== dashboardStore.cursor) {
                return;
            }

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
                    const targetField = fieldMetas.find(m => m.fid === filter.field.fid);
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
                    fields={fieldMetas}
                    onFilterSubmit={(field, filter) => {
                        dashboardStore.addFilter(field, filter);
                    }}
                />
            </ResourceList>
            <EditArea>
                <div style={{ padding: '1em 1.5em' }} ref={editAreaRef}>
                    <GridLayout
                        className="layout"
                        cols={12}
                        width={12 * 100}
                        rowHeight={100}
                        onLayoutChange={handleLayoutChange}
                        style={{
                            width: 12 * 100,
                        }}
                    >
                        {items.map((item, i) => {
                            const vis = collectionList.find(e => e.viewId === item.viewId);

                            return vis ? (
                                <EditItem
                                    key={`${dashboardStore.cursor}:${item.viewId}`}
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
                                    <KanbanChart
                                        dataSource={cleanedData}
                                        fieldMeta={fieldMetas}
                                        subset={vis.spec}
                                        item={item}
                                        filters={mergeFilters(i, vis)}
                                        updateFilters={fs => filter$.next({ index: i, data: fs })}
                                        toggleFilter={() => dashboardStore.setItem(i, { ...item, filter: !item.filter })}
                                        remove={() => dashboardStore.removeItem(i)}
                                        edit={() => {
                                            semiAutoStore.clearViews();
                                            semiAutoStore.updateMainView({
                                                fields: vis.fields,
                                                imp: vis.score ?? 0,
                                            });
                                            commonStore.setAppKey(PIVOT_KEYS.semiAuto);
                                        }}
                                    />
                                </EditItem>
                            ) : null;
                        })}
                    </GridLayout>
                </div>
                <Tools
                    items={items}
                    ref={editAreaRef}
                    clearPage={() => dashboardStore.clearPage()}
                />
            </EditArea>
        </Segment>
    );
};

export default observer(Kanban);
