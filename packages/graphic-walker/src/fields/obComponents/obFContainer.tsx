import React from 'react';
import { observer } from 'mobx-react-lite'
import { FieldsContainer } from '../components';
import { useGlobalStore } from '../../store';
import {
    Draggable,
    DroppableProvided
} from "react-beautiful-dnd";
import { IDraggableStateKey } from '../../interfaces';
import OBPill from './obPill';

interface FieldContainerProps {
    provided: DroppableProvided
    /**
     * draggable Field Id
     */
    dkey: IDraggableStateKey;
}
const OBFieldContainer: React.FC<FieldContainerProps> = props => {
    const { provided, dkey } = props;
    const { vizStore } = useGlobalStore();
    const { draggableFieldState } = vizStore;
    return <FieldsContainer
        {...provided.droppableProps}
        ref={provided.innerRef}
    >
        {/* {provided.placeholder} */}
        {draggableFieldState[dkey.id].map((f, index) => (
            <Draggable key={f.dragId} draggableId={f.dragId} index={index}>
                {(provided, snapshot) => {
                    return (
                        <OBPill dkey={dkey} fIndex={index} provided={provided} />
                    );
                }}
            </Draggable>
        ))}
    </FieldsContainer>
}

export default observer(OBFieldContainer);
