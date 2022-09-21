import React, { useCallback } from 'react';
import { DraggableFieldState, IDraggableStateKey } from '../interfaces';
import {
    DragDropContext,
    DropResult,
    ResponderProvided,
    DraggableLocation,
} from "react-beautiful-dnd";
import { useGlobalStore } from '../store';
window['__react-beautiful-dnd-disable-dev-warnings'] = true;


export const FieldsContextWrapper: React.FC = props => {
    const { vizStore } = useGlobalStore();
    const onDragEnd = useCallback((result: DropResult, provided: ResponderProvided) => {
        if (!result.destination) {
            vizStore.removeField(result.source.droppableId as keyof DraggableFieldState, result.source.index)
            return;
        }
        const destination = result.destination as DraggableLocation;
        if (destination.droppableId === result.source.droppableId) {
            if (destination.index === result.source.index) return;
            vizStore.reorderField(destination.droppableId as keyof DraggableFieldState, result.source.index, destination.index);
        } else {
            let sourceKey = result.source
                    .droppableId as keyof DraggableFieldState;
            let targetKey = destination
                .droppableId as keyof DraggableFieldState;
            vizStore.moveField(sourceKey, result.source.index, targetKey, destination.index)
        }
    }, [])
    return <DragDropContext onDragEnd={onDragEnd}
        onDragStart={() => {}}
        onDragUpdate={() => {}}
    >
        { props.children }
    </DragDropContext>
}

export default FieldsContextWrapper;

export const DRAGGABLE_STATE_KEYS: Readonly<IDraggableStateKey[]> = [
    { id: 'fields', mode: 0 },
    { id: 'columns', mode: 0 },
    { id: 'rows', mode: 0 },
    { id: 'color', mode: 1 },
    { id: 'opacity', mode: 1 },
    { id: 'size', mode: 1 },
    { id: 'shape', mode: 1},
    { id: 'theta', mode: 1 },
    { id: 'radius', mode: 1 },
    { id: 'filters', mode: 1 },
] as const;

export const AGGREGATOR_LIST: Readonly<string[]> = [
    'sum',
    'mean',
    'count',
] as const;
