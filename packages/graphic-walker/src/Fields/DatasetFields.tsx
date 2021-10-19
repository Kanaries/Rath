import React from 'react';
import { NestContainer } from '../components/container'
import { observer } from 'mobx-react-lite';
import {
    Droppable,
    Draggable,
  } from "react-beautiful-dnd";

import { DraggableFieldState } from './fieldsContext';
import { useGlobalStore } from '../store';
import DataTypeIcon from '../components/dataTypeIcon';
import { IViewField } from '../interfaces';

const FIELDS_KEY: keyof DraggableFieldState = 'fields';

const DatasetFields: React.FC = props => {
    const { vizStore } = useGlobalStore();
    const { draggableFieldState } = vizStore;
    const { fields } = draggableFieldState;

    const dimensions: IViewField[] = []; // = draggableFieldState[FIELDS_KEY].filter(f => f.type === 'D');
    const measures: IViewField[] = []; // = draggableFieldState[FIELDS_KEY].filter(f => f.type === 'M');
    const dimOriginIndices: number[] = [];
    const meaOriginIndices: number[] = [];

    for (let i = 0; i < fields.length; i++) {
        if (fields[i].type === 'D') {
            dimensions.push(fields[i]);
            dimOriginIndices.push(i)
        } else {
            measures.push(fields[i])
            meaOriginIndices.push(i);
        }
    }

    console.log('render')

    return <NestContainer style={{ minHeight: '680px', overflowY: 'auto' }}>
        <h4 className="text-xs mb-2">字段列表</h4>
        <Droppable droppableId={FIELDS_KEY} direction="vertical" isDropDisabled={true}>
            {(provided, snapshot) => (
                <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                >
                    {dimensions.map((f, index) => (
                        <Draggable key={f.dragId} draggableId={f.dragId} index={dimOriginIndices[index]}>
                            {(provided, snapshot) => {
                                return (
                                    <>
                                        <div
                                            className="pt-0.5 pb-0.5 pl-2 pr-2 m-1 text-xs hover:bg-blue-100 rounded-full"
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                        >
                                            <DataTypeIcon dataType="string" /> {f.name}&nbsp;
                                        </div>
                                        {
                                            snapshot.isDragging && <div className="pt-0.5 pb-0.5 pl-2 pr-2 m-1 text-xs hover:bg-blue-100 rounded-full border-blue-400 border">
                                                <DataTypeIcon dataType="string" /> {f.name}&nbsp;
                                            </div>
                                        }
                                    </>
                                );
                            }}
                        </Draggable>
                    ))}
                    {measures.map((f, index) => (
                        <Draggable key={f.dragId} draggableId={f.dragId} index={meaOriginIndices[index]}>
                            {(provided, snapshot) => {
                                return (
                                    <>
                                        <div
                                            className="pt-0.5 pb-0.5 pl-2 pr-2 m-1 text-xs hover:bg-blue-100 rounded-full"
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                        >
                                            <DataTypeIcon dataType="number" /> {f.name}&nbsp;
                                        </div>
                                        {
                                            snapshot.isDragging && <div className="pt-0.5 pb-0.5 pl-2 pr-2 m-1 text-xs hover:bg-blue-100 rounded-full border-blue-400 border">
                                                <DataTypeIcon dataType="number" /> {f.name}&nbsp;
                                            </div>
                                        }
                                    </>
                                );
                            }}
                        </Draggable>
                    ))}
                    {provided.placeholder}
                </div>
            )}
        </Droppable>
    </NestContainer>
}

export default observer(DatasetFields);