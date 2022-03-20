import React from 'react';
import { Draggable, DroppableProvided } from 'react-beautiful-dnd';
import { observer } from 'mobx-react-lite';
import { useGlobalStore } from '../../store';
import DataTypeIcon from '../../components/dataTypeIcon';

interface Props {
    provided: DroppableProvided;
}
const MeaFields: React.FC<Props> = props => {
    const { provided } = props;
    const { vizStore } = useGlobalStore();
    const measures = vizStore.draggableFieldState.measures;
    return <div {...provided.droppableProps} ref={provided.innerRef}>
        {measures.map((f, index) => (
            <Draggable key={f.dragId} draggableId={f.dragId} index={index}>
                {(provided, snapshot) => {
                    return (
                        <>
                            <div
                                className="pt-0.5 pb-0.5 pl-2 pr-2 m-1 text-xs hover:bg-blue-100 rounded-full truncate"
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                            >
                                <DataTypeIcon dataType={f.semanticType} /> {f.name}&nbsp;
                            </div>
                            {
                                <div className={`pt-0.5 pb-0.5 pl-2 pr-2 m-1 text-xs hover:bg-blue-100 rounded-full border-blue-400 border truncate ${snapshot.isDragging ? '' : 'hidden'}`}>
                                    <DataTypeIcon dataType={f.semanticType} /> {f.name}&nbsp;
                                </div>
                            }
                        </>
                    );
                }}
            </Draggable>
        ))}
    </div>
}

export default observer(MeaFields);
