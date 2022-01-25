import React, { useCallback } from 'react';
import { DraggableFieldState, Field, IDraggableStateKey } from '../interfaces';
import {
    DragDropContext,
    DropResult,
    ResponderProvided,
    DraggableLocation,
} from "react-beautiful-dnd";
import { useGlobalStore } from '../store';


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
    return <DragDropContext onDragEnd={onDragEnd}>
        { props.children }
    </DragDropContext>
}

export default FieldsContextWrapper;

export const DRAGGABLE_STATE_KEYS: Array<IDraggableStateKey> = [
    { id: 'fields', name: '字段', mode: 0 },
    { id: 'columns', name: '列', mode: 0 },
    { id: 'rows', name: '行', mode: 0 },
    { id: 'color', name: '颜色', mode: 1 },
    { id: 'opacity', name: '透明度', mode: 1 },
    { id: 'size', name: '大小', mode: 1 },
];

export const AGGREGATOR_LIST = [
    {
      value: "sum",
      label: "求和",
    },
    {
      value: "mean",
      label: "平均值",
    },
    {
      value: "count",
      label: "计数",
    },
];
