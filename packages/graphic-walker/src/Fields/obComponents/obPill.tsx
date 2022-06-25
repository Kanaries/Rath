import { SortAscendingIcon, SortDescendingIcon } from '@heroicons/react/outline';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { DraggableProvided } from 'react-beautiful-dnd';
import { COUNT_FIELD_ID } from '../../constants';
import { IDraggableStateKey } from '../../interfaces';
import { useGlobalStore } from '../../store';
import { Pill } from '../components';
import { AGGREGATOR_LIST } from '../fieldsContext';

interface PillProps {
    provided: DraggableProvided;
    fIndex: number;
    dkey: IDraggableStateKey;
}
const OBPill: React.FC<PillProps> = props => {
    const { provided, dkey, fIndex } = props;
    const { vizStore } = useGlobalStore();
    const { visualConfig } = vizStore;
    const field = vizStore.draggableFieldState[dkey.id][fIndex];
    return <Pill
        ref={provided.innerRef}
        // type={f.type}
        colType={field.analyticType === 'dimension' ? 'discrete' : 'continuous'}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
    >
        {field.name}&nbsp;
        {field.analyticType === 'measure' && field.fid !== COUNT_FIELD_ID && visualConfig.defaultAggregated && (
            <select
                className="bg-transparent text-gray-700 float-right focus:outline-none focus:border-gray-500"
                value={field.aggName || ''}
                onChange={(e) => { vizStore.setFieldAggregator(dkey.id, fIndex, e.target.value) }}
            >
                {
                    AGGREGATOR_LIST.map(op => <option value={op.value} key={op.value}>{op.label}</option>)
                }
            </select>
        )}
        {field.analyticType === 'dimension' && field.sort === 'ascending' && <SortAscendingIcon className='float-right w-3' />}
        {field.analyticType === 'dimension' && field.sort === 'descending' && <SortDescendingIcon className='float-right w-3' />}
    </Pill>
}

export default observer(OBPill);
