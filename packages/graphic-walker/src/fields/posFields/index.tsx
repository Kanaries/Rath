import React from 'react';
import { FieldListContainer } from "../components";
import {
    Droppable,
    Draggable
  } from "react-beautiful-dnd";

import { DRAGGABLE_STATE_KEYS } from '../fieldsContext';

import OBFieldContainer from '../obComponents/obFContainer';
import { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { useGlobalStore } from '../../store';


const PosFields: React.FC = props => {
    const { vizStore } = useGlobalStore();
    const { visualConfig } = vizStore;
    const { geoms } = visualConfig;

    const channels = useMemo(() => {
        if (geoms[0] === 'arc') {
            return DRAGGABLE_STATE_KEYS.filter(f => f.id === 'radius' || f.id === 'theta');
        }
        return DRAGGABLE_STATE_KEYS.filter(f => f.id === 'columns' || f.id === 'rows');
    }, [geoms[0]])
    return <div>
        {
            channels.map(dkey => <FieldListContainer name={dkey.id} key={dkey.id}>
                <Droppable droppableId={dkey.id} direction="horizontal">
                    {(provided, snapshot) => (
                        <OBFieldContainer dkey={dkey} provided={provided} />
                    )}
                </Droppable>
            </FieldListContainer>)
        }
    </div>
}

export default observer(PosFields);