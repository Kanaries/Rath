import { observer } from 'mobx-react-lite';
import React from 'react';
import {
    Draggable,
    DraggableProvided,
    Droppable, DroppableProvided,
} from "react-beautiful-dnd";
import { useGlobalStore } from '../store';
import { FilterFieldContainer, FilterFieldsContainer } from './components';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import Modal from '../components/modal';


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
  '> div': {
    minHeight: '20px',
  },
});

const FilterPill: React.FC<FilterPillProps> = observer(props => {
    const { provided, fIndex } = props;
    const { vizStore } = useGlobalStore();
    const { draggableFieldState } = vizStore;

    const field = draggableFieldState.filters[fIndex];

    const { t } = useTranslation('translation', { keyPrefix: '?' });

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
            {
                field.rule && (
                    <div className="bg-white">
                        {field.rule}
                    </div>
                )
            }
            {
                field.rule || (
                    <div
                        className="bg-white text-gray-500 hover:bg-gray-100"
                        onClick={() => vizStore.setFilterEditing(fIndex)}
                        style={{ cursor: 'pointer' }}
                    >
                        {t('empty_rule')}
                    </div>
                )
            }
        </Pill>
    );
});

interface FieldContainerProps {
    provided: DroppableProvided;
}

const FilterItemContainer: React.FC<FieldContainerProps> = observer(({ provided }) => {
    const { vizStore } = useGlobalStore();
    const { draggableFieldState: { filters } } = vizStore;

    const { t } = useTranslation('translation', { keyPrefix: '?' });

    console.log('->', vizStore.editingFilterIdx);

    return (
        <FilterFieldsContainer
            {...provided.droppableProps}
            ref={provided.innerRef}
        >
            {filters.map((f, index) => (
                <Draggable key={f.dragId} draggableId={f.dragId} index={index}>
                    {(provided, snapshot) => {
                        return (
                            <FilterPill
                                fIndex={index}
                                provided={provided}
                            />
                        );
                    }}
                </Draggable>
            ))}
            {provided.placeholder}
            {vizStore.editingFilterIdx !== null && (
                <Modal
                    title={t('editing')}
                    onClose={() => {
                        console.log('close');
                        vizStore.closeFilterEditing();  // FIXME: Why not work???
                    }}
                >
                    <div>
                        ???
                    </div>
                </Modal>
            )}
        </FilterFieldsContainer>
    );
});

const FilterField: React.FC = () => {
    return (
        <div>
            <FilterFieldContainer>
                <Droppable droppableId="filters" direction="vertical">
                    {(provided, snapshot) => (
                        <FilterItemContainer
                            provided={provided}
                        />
                    )}
                </Droppable>
            </FilterFieldContainer>
        </div>
    );
};

export default FilterField;