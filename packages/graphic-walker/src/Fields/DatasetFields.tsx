import React from 'react';
import { FieldListContainer, FieldsContainer, Pill } from "./components";
import { NestContainer } from '../components/container'
import { observer } from 'mobx-react-lite';
import {
    DragDropContext,
    Droppable,
    Draggable,
    DropResult,
    ResponderProvided,
    DraggableLocation,
  } from "react-beautiful-dnd";

import { AGGREGATOR_LIST, DRAGGABLE_STATE_KEYS } from './fieldsContext';
import { useGlobalStore } from '../store';

const rowsAndCols = DRAGGABLE_STATE_KEYS.filter(f => f.id === 'fields');
const DatasetFields: React.FC = props => {
    const { vizStore } = useGlobalStore();
    const { draggableFieldState } = vizStore;

    return <NestContainer style={{ minHeight: '680px', overflowY: 'auto' }}>
        <h4 className="text-xs mb-2">字段列表</h4>
        {
            rowsAndCols.map(dkey => <div key={dkey.id}>
                <Droppable droppableId={dkey.id} direction="vertical">
                    {(provided, snapshot) => (
                        <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                        >
                            {draggableFieldState[dkey.id].map((f, index) => (
                                <Draggable key={f.id} draggableId={f.id} index={index}>
                                    {(provided, snapshot) => {
                                        return (
                                            <div
                                                className="pt-0.5 pb-0.5 pl-2 pr-2 m-1 text-xs hover:bg-blue-100 rounded-full"
                                                ref={provided.innerRef}
                                                // type={f.type}
                                                // colType={f.type === 'D' ? 'discrete' : 'continuous'}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                            >
                                                {f.name}&nbsp;
                                            </div>
                                        );
                                    }}
                                </Draggable>
                            ))}
                        </div>
                    )}
                </Droppable>
            </div>)
        }
    </NestContainer>
}

export default observer(DatasetFields);