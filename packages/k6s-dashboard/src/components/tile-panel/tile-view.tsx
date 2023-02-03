import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import { useState, useEffect, useCallback } from 'react';
import produce from 'immer';
import { ChevronDownIcon, ChevronRightIcon, DocumentTextIcon, StopIcon, ViewColumnsIcon } from '@heroicons/react/24/outline';
import { DragDropContext, OnDragStartResponder, OnDragEndResponder, Droppable, Draggable } from 'react-beautiful-dnd';
import { useDashboardContext } from '@store/index';
import type { DashboardBlock } from 'src/interfaces';


const Item = styled.div`
    width: 100%;
    flex-grow: 0;
    flex-shrink: 0;
`;

const ItemList = styled.div`
    display: flex;
    flex-direction: column;
    font-size: 0.9rem;
    user-select: none;
`;

const ItemHeader = styled.div<{ isSelected: boolean; isDragging: boolean }>`
    cursor: pointer;
    background-color: ${({ isSelected }) => isSelected ? '#ddf' : '#eee'};
    :hover {
        filter: brightness(0.9);
    }
    display: flex;
    opacity: ${({ isDragging }) => isDragging ? 0.6 : 1};
    > * {
        flex-grow: 0;
        flex-shrink: 0;
        &:last-child {
            flex-grow: 1;
        }
    }
    span {
        color: #666;
    }
    small {
        font-size: 0.7rem;
        color: #aaa;
    }
`;

const ItemSpin = styled.div`
    width: 1em;
    text-align: center;
    user-select: none;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const ItemIcon = styled.div`
    width: 1em;
    margin-inline: 0.3em;
    text-align: center;
    user-select: none;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const TileList = observer<{ items: DashboardBlock[]; level: number; id: string; open: boolean }>(function TileList ({ items, level, id, open }) {
    const dashboard = useDashboardContext();
    const { selections } = dashboard;

    const [openKeys, setOpenKeys] = useState<Record<string, boolean | undefined>>({});

    useEffect(() => {
        const list = items.filter(d => d.type === 'layout').map(d => d.id);
        setOpenKeys(prev => {
            return Object.fromEntries(
                list.map(d => [d, d in prev ? prev[d] : true])
            );
        });
    }, [items]);

    if (!open) {
        return null;
    }

    return (
        // @ts-expect-error this is valid
        <Droppable droppableId={id}>
            {provided => (
                // @ts-expect-error this is valid
                <ItemList
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    onClick={e => e.stopPropagation()}
                >
                    {items.map((item, i) => {
                        const isSelected = selections.some(which => which === item);

                        if (item.type === 'layout') {
                            const isOpen = openKeys[item.id] ?? true;
                            return (
                                <Item key={i}>
                                    {level > 0 && (
                                        // @ts-expect-error this is valid
                                        <Draggable key={i} index={i} draggableId={item.id}>
                                            {(provided, snapshot) => (
                                                <ItemHeader
                                                    isSelected={isSelected}
                                                    ref={provided.innerRef}
                                                    isDragging={snapshot.isDragging}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    style={{ ...provided.draggableProps.style, paddingLeft: `${level}em` }}
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        setOpenKeys(opts => produce(opts, draft => {
                                                            draft[item.id] = !draft[item.id];
                                                        }));
                                                    }}
                                                >
                                                    <ItemSpin>
                                                        {isOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}
                                                    </ItemSpin>
                                                    <ItemIcon>
                                                        <ViewColumnsIcon
                                                            style={{
                                                                transform: item.direction === 'horizontal' ? '' : 'rotate(90deg)',
                                                            }}
                                                        />
                                                    </ItemIcon>
                                                    <span
                                                        role="button"
                                                        tabIndex={0}
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            dashboard.toggleSelect(item, e.shiftKey);
                                                        }}
                                                        onKeyDown={e => e.key === 'Space' && (e.target as HTMLSpanElement).click()}
                                                    >
                                                        {`${item.direction} ${item.type} `}
                                                    </span>
                                                </ItemHeader>
                                            )}
                                        </Draggable>
                                    )}
                                    <TileList open={isOpen} id={item.id} level={level + 1} items={item.children} />
                                </Item>
                            );
                        }
                        return (
                            <Item key={i}>
                                {/* @ts-expect-error this is valid */}
                                <Draggable index={i} draggableId={item.id}>
                                    {(provided, snapshot) => (
                                        <ItemHeader
                                            isSelected={isSelected}
                                            ref={provided.innerRef}
                                            isDragging={snapshot.isDragging}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            style={{ ...provided.draggableProps.style, paddingLeft: `${level}em` }}
                                            onClick={e => {
                                                e.stopPropagation();
                                                dashboard.toggleSelect(item, e.shiftKey);
                                            }}
                                        >
                                            <ItemSpin />
                                            <ItemIcon>
                                                {({
                                                    text: <DocumentTextIcon />,
                                                    blank: <StopIcon />,
                                                } as Partial<Record<DashboardBlock['type'], JSX.Element>>)[item.type]}
                                            </ItemIcon>
                                            <span>
                                                {`${item.type} `}
                                                <small>{`${item.id}`}</small>
                                            </span>
                                        </ItemHeader>
                                    )}
                                </Draggable>
                            </Item>
                        );
                    })}
                    {provided.placeholder}
                </ItemList>
            )}
        </Droppable >
    );
});

const Container = styled.div`
    flex-grow: 1;
    flex-shrink: 1;
    overflow: auto;
    background-color: #eee;
`;

const TileView = observer(function TileView() {
    const dashboard = useDashboardContext();
    const root = dashboard.spec.items;

    const handleDragStart = useCallback<OnDragStartResponder>(ev => {
        const { draggableId } = ev;
        const which = dashboard.getBlockById(draggableId);
        if (!which) {
            return;
        }
        if (!dashboard.selections.some(b => b.id === which.id)) {
            dashboard.clearSelections();
            dashboard.toggleSelect(which);
        }
        // do nothing
    }, [dashboard]);

    const handleDragEnd = useCallback<OnDragEndResponder>(ev => {
        const { destination } = ev;
        if (!destination) {
            return;
        }
        const selections = dashboard.selections as DashboardBlock[];
        if (selections.length === 0) {
            return;
        }
        const target = dashboard.getBlockById(destination.droppableId);
        if (target?.type === 'layout') {
            dashboard.moveBlocks(selections, target, destination.index);
        }
    }, [dashboard]);

    return (
        <Container
            onClick={() => dashboard.clearSelections()}
        >
            {/* @ts-expect-error this is valid */}
            <DragDropContext
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <TileList open id="root" level={0} items={[root]} />
            </DragDropContext>
        </Container>
    );
});


export default TileView;
