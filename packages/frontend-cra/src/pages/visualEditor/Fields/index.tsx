import React, { useState, useEffect, useCallback } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  ResponderProvided,
  DraggableLocation,
} from "react-beautiful-dnd";
import styled from "styled-components";
import produce from "immer";
import { FieldListContainer, FieldsContainer } from "./components";
import { move, reorder } from "./utils";
import { Field } from "../interfaces";
import { Container } from '../components/container'
import { Pill, DropdownSelect } from '@tableau/tableau-ui';

const RootContainer = styled.div`
  font-size: 12px;
`;

const aggregatorList = [
  {
    value: "sum",
    label: "求和",
  },
  {
    value: "mean",
    label: "平均值",
  },
  {
    value: "count",
    label: "计数",
  },
];

export interface DraggableFieldState {
  fields: Field[];
  rows: Field[];
  columns: Field[];
  color: Field[];
  opacity: Field[];
  size: Field[];
}

// const draggableStateKeys = Object.keys(initDraggableState) as Array<
//   keyof DraggableFieldState
// >;

const draggableStateKeys: Array<{
  id: keyof DraggableFieldState;
  name: string;
  mode: number
}> = [
  { id: 'fields', name: '字段', mode: 0 },
  { id: 'columns', name: '列', mode: 0 },
  { id: 'rows', name: '行', mode: 0 },
  { id: 'color', name: '颜色', mode: 1 },
  { id: 'opacity', name: '透明度', mode: 1 },
  { id: 'size', name: '大小', mode: 1 },
];


interface DraggableFieldsProps {
  fields: Field[];
  onStateChange?: (state: DraggableFieldState) => void;
}

const DraggableFields: React.FC<DraggableFieldsProps> = (props) => {
  const { fields = [], onStateChange } = props;
  const [state, setState] = useState<DraggableFieldState>({
    fields: [],
    rows: [],
    columns: [],
    color: [],
    opacity: [],
    size: []
  });
  useEffect(() => {
    setState({
      fields,
      rows: [],
      columns: [],
      color: [],
      opacity: [],
      size: [],
    });
  }, [fields]);
  useEffect(() => {
    if (onStateChange) {
      onStateChange(state);
    }
  }, [state, onStateChange]);
  const onDragEnd = useCallback(
    (result: DropResult, provided: ResponderProvided) => {
      if (!result.destination) {
        return;
      }
      const destination = result.destination as DraggableLocation;
      if (destination.droppableId === result.source.droppableId) {
        if (destination.index === result.source.index) return;
        setState((state) => {
          let listKey = destination
            .droppableId as keyof DraggableFieldState;
          let newList = reorder(
            state[listKey],
            result.source.index,
            destination.index
          );
          return {
            ...state,
            [listKey]: newList,
          };
        });
      } else {
        setState((state) => {
          let sourceKey = result.source
            .droppableId as keyof DraggableFieldState;
          let targetKey = destination
            .droppableId as keyof DraggableFieldState;
          let { originList, targetList } = move(
            state[sourceKey],
            result.source.index,
            state[targetKey],
            destination.index
          );
          return {
            ...state,
            [sourceKey]: originList,
            [targetKey]: targetList,
          };
        });
      }
    },
    [setState]
  );
  return (
    <RootContainer>
      <DragDropContext onDragEnd={onDragEnd}>
        {draggableStateKeys
          .filter((d) => d.mode === 0)
          .map((dkey) => (
            <FieldListContainer name={dkey.name} key={dkey.id}>
              <Droppable droppableId={dkey.id} direction="horizontal">
                {(provided, snapshot) => (
                  <FieldsContainer
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {state[dkey.id].map((f, index) => (
                      <Draggable key={f.id} draggableId={f.id} index={index}>
                        {(provided, snapshot) => {
                          return (
                            <Pill
                              ref={provided.innerRef}
                              // type={f.type}
                              kind={f.type === 'D' ? 'discrete' : 'continuous'}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              {f.name}&nbsp;
                              {f.type === 'M' && (
                                <DropdownSelect
                                  kind="text"
                                  style={{ float: 'right' }}
                                  value={f.aggName || ''}
                                  onChange={(e) => {
                                    setState((state) => {
                                      const nextState = produce<
                                        DraggableFieldState
                                      >(state, (draft) => {
                                        draft[dkey.id][index].aggName = e.target.value;
                                      });
                                      return nextState;
                                    });
                                  }}
                                >
                                  {
                                    aggregatorList.map(op => <option value={op.value} key={op.value}>{op.label}</option>)
                                  }
                                </DropdownSelect>
                              )}
                            </Pill>
                          );
                        }}
                      </Draggable>
                    ))}
                  </FieldsContainer>
                )}
              </Droppable>
            </FieldListContainer>
          ))}
        <div style={{ position: 'relative' }}>
          <Container style={{ position: 'absolute', width: 300, right: 0, top: 0 }}>
            {draggableStateKeys
              .filter((d) => d.mode === 1)
              .map((dkey) => (
                <FieldListContainer name={dkey.name} key={dkey.id}>
                  <Droppable droppableId={dkey.id} direction="horizontal">
                    {(provided, snapshot) => (
                      <FieldsContainer
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                      >
                        {state[dkey.id].map((f, index) => (
                          <Draggable
                            key={f.id}
                            draggableId={f.id}
                            index={index}
                          >
                            {(provided, snapshot) => {
                              return (
                                <Pill
                                  ref={provided.innerRef}
                                  // type={f.type}
                                  kind={f.type === 'D' ? 'discrete' : 'continuous'}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                >
                                  {f.name}&nbsp;
                                  {f.type === 'M' && (
                                    <DropdownSelect
                                      kind="text"
                                      style={{ float: 'right' }}
                                      value={f.aggName || ''}
                                      onChange={(e) => {
                                        setState((state) => {
                                          const nextState = produce<
                                            DraggableFieldState
                                          >(state, (draft) => {
                                            draft[dkey.id][index].aggName =
                                              e.target.value;
                                          });
                                          return nextState;
                                        });
                                      }}
                                    >
                                      {aggregatorList.map((op) => (
                                        <option value={op.value} key={op.value}>
                                          {op.label}
                                        </option>
                                      ))}
                                    </DropdownSelect>
                                  )}
                                </Pill>
                              );
                            }}
                          </Draggable>
                        ))}
                      </FieldsContainer>
                    )}
                  </Droppable>
                </FieldListContainer>
              ))}
          </Container>
        </div>
      </DragDropContext>
    </RootContainer>
  );
};

export default DraggableFields;
