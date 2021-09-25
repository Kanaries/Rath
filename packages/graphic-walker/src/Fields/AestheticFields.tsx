import React from 'react';
import {
    Droppable,
    Draggable,
} from "react-beautiful-dnd";
import { AGGREGATOR_LIST, DRAGGABLE_STATE_KEYS } from './fieldsContext';
import { AestheticFieldContainer, FieldsContainer, Pill } from './components'
import { useGlobalStore } from '../store/index'

const aestheticFields = DRAGGABLE_STATE_KEYS.filter(f => ['color', 'opacity', 'size'].includes(f.id));

const AestheticFields: React.FC = props => {
    const { vizStore } = useGlobalStore();
    const { draggableFieldState } = vizStore;
    return <div>
        {
            aestheticFields.map(dkey => <AestheticFieldContainer name={dkey.name} key={dkey.id}>
                <Droppable droppableId={dkey.id} direction="horizontal">
                    {(provided, snapshot) => (
                        <FieldsContainer
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                        >
                            {provided.placeholder}
                            {draggableFieldState[dkey.id].map((f, index) => (
                                <Draggable key={`${dkey.id}-${f.id}`} draggableId={`${dkey.id}-${f.id}`} index={index}>
                                    {(provided, snapshot) => {
                                        return (
                                            <Pill
                                                ref={provided.innerRef}
                                                // type={f.type}
                                                colType={f.type === 'D' ? 'discrete' : 'continuous'}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                            >
                                                {f.name}&nbsp;
                                                {f.type === 'M' && (
                                                    <select
                                                        className="bg-transparent text-gray-700 float-right focus:outline-none focus:border-gray-500"
                                                        value={f.aggName || ''}
                                                        onChange={(e) => { vizStore.setFieldAggregator(dkey.id, index, e.target.value) }}
                                                    >
                                                        {
                                                            AGGREGATOR_LIST.map(op => <option value={op.value} key={op.value}>{op.label}</option>)
                                                        }
                                                    </select>
                                                )}
                                            </Pill>
                                        );
                                    }}
                                </Draggable>
                            ))}
                        </FieldsContainer>
                    )}
                </Droppable>
            </AestheticFieldContainer>)
        }
    </div>
}

export default AestheticFields;