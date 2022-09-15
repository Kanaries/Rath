import { BarsArrowDownIcon, BarsArrowUpIcon } from '@heroicons/react/24/outline';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { DraggableProvided } from 'react-beautiful-dnd';
import { COUNT_FIELD_ID } from '../../constants';
import { IDraggableStateKey } from '../../interfaces';
import { useGlobalStore } from '../../store';
import { Pill } from '../components';
import { AGGREGATOR_LIST } from '../fieldsContext';
import { useTranslation } from 'react-i18next';


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
    const { t } = useTranslation('translation', { keyPrefix: 'constant.aggregator' });

    return <Pill
        ref={provided.innerRef}
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
                    AGGREGATOR_LIST.map(op => <option value={op} key={op}>{t(op)}</option>)
                }
            </select>
        )}
        {field.analyticType === 'dimension' && field.sort === 'ascending' && <BarsArrowUpIcon className='float-right w-3' role="status" aria-label="Sorted in ascending order" />}
        {field.analyticType === 'dimension' && field.sort === 'descending' && <BarsArrowDownIcon className='float-right w-3' role="status" aria-label="Sorted in descending order" />}
    </Pill>
}

export default observer(OBPill);
