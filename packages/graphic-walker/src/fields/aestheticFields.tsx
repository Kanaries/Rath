import React from 'react';
import {
    Droppable,
} from "react-beautiful-dnd";
import { DRAGGABLE_STATE_KEYS } from './fieldsContext';
import { AestheticFieldContainer } from './components'

import OBFieldContainer from './obComponents/obFContainer';

const aestheticFields = DRAGGABLE_STATE_KEYS.filter(f => ['color', 'opacity', 'size', 'shape'].includes(f.id));

const AestheticFields: React.FC = props => {
    return <div>
        {
            aestheticFields.map(dkey => <AestheticFieldContainer name={dkey.id} key={dkey.id}>
                <Droppable droppableId={dkey.id} direction="horizontal">
                    {(provided, snapshot) => (
                        <OBFieldContainer dkey={dkey} provided={provided} />
                    )}
                </Droppable>
            </AestheticFieldContainer>)
        }
    </div>
}

export default AestheticFields;