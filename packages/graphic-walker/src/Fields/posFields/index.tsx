import React from 'react';
import { FieldListContainer } from "../components";
import {
    Droppable,
    Draggable
  } from "react-beautiful-dnd";

import { DRAGGABLE_STATE_KEYS } from '../fieldsContext';

import OBFieldContainer from '../obComponents/obFContainer';

const rowsAndCols = DRAGGABLE_STATE_KEYS.filter(f => f.id === 'columns' || f.id === 'rows');
const PosFields: React.FC = props => {

    return <div>
        {
            rowsAndCols.map(dkey => <FieldListContainer name={dkey.name} key={dkey.id}>
                <Droppable droppableId={dkey.id} direction="horizontal">
                    {(provided, snapshot) => (
                        <OBFieldContainer dkey={dkey} provided={provided} />
                    )}
                </Droppable>
            </FieldListContainer>)
        }
    </div>
}

export default PosFields;