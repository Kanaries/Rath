import { observer } from 'mobx-react-lite';
import React from 'react';
import { DraggableProvided } from "react-beautiful-dnd";
import { useGlobalStore } from '../../store';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { PencilSquareIcon } from '@heroicons/react/24/solid';


interface FilterPillProps {
    provided: DraggableProvided;
    fIndex: number;
}

const Pill = styled.div({
  userSelect: 'none',
  alignItems: 'stretch',
  borderStyle: 'solid',
  borderWidth: '1px',
  boxSizing: 'border-box',
  cursor: 'default',
  display: 'flex',
  flexDirection: 'column',
  fontSize: '12px',
  minWidth: '150px',
  overflowY: 'hidden',
  padding: 0,

  '> *': {
    flexGrow: 1,
    paddingBlock: '0.2em',
    paddingInline: '0.5em',
  },
  
  '> header': {
    height: '20px',
    borderBottomWidth: '1px',
  },
  '> div.output': {
    minHeight: '20px',

    '> span': {
        overflowY: 'hidden',
        maxHeight: '4em',
    },
  },

  '> .output .icon': {
    display: 'none',
  },
  '> .output:hover .icon': {
    display: 'unset',
  },
});

const FilterPill: React.FC<FilterPillProps> = observer(props => {
    const { provided, fIndex } = props;
    const { vizStore } = useGlobalStore();
    const { draggableFieldState } = vizStore;

    const field = draggableFieldState.filters[fIndex];

    const { t } = useTranslation('translation', { keyPrefix: 'filters' });

    return (
        <Pill
            className="text-gray-900"
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
        >
            <header className="bg-indigo-50">
                {field.name}
            </header>
            <div
                className="bg-white text-gray-500 hover:bg-gray-100 flex flex-row output"
                onClick={() => vizStore.setFilterEditing(fIndex)}
                style={{ cursor: 'pointer' }}
                title={t('to_edit')}
            >
                {
                    field.rule ? (
                        <span className="flex-1">
                            {
                                field.rule.type === 'one of' ? (
                                    `oneOf: [${[...field.rule.value].map(d => JSON.stringify(d)).join(', ')}]`
                                ) : field.rule.type === 'range' ? (
                                    `range: [${field.rule.value[0]}, ${field.rule.value[1]}]`
                                ) : field.rule.type === 'temporal range' ? (
                                    `range: [${new Date(field.rule.value[0])}, ${new Date(field.rule.value[1])}]`
                                ) : null
                            }
                        </span>
                    ) : (
                        <span className="text-gray-600 flex-1">
                            {t('empty_rule')}
                        </span>
                    )
                }
                <PencilSquareIcon
                    className="icon flex-grow-0 flex-shrink-0 pointer-events-none text-gray-500"
                    role="presentation"
                    aria-hidden
                    width="1.4em"
                    height="1.4em"
                />
            </div>
        </Pill>
    );
});


export default FilterPill;
