import React, { useState, useEffect, useCallback } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  ResponderProvided,
} from "react-beautiful-dnd";
import styled from "styled-components";
import Select, { Option } from "./select";
import produce from "immer";
import { FieldListContainer, FieldsContainer, FieldLabel } from './components';
import { move, reorder } from './utils';
import { Insight } from 'visual-insights';
const InsightNameMap: {
  [key: string]: string;
} = {
  [Insight.DefaultIWorker.cluster]: 'Cluster',
  [Insight.DefaultIWorker.outlier]: 'Outlier',
  [Insight.DefaultIWorker.trend]: 'Trend'
} as const;
export interface Field {
  /**
   * id: key in data record
   */
  id: string;
  /**
   * display name for field
   */
  name: string;
  /**
   * aggregator's name
   */
  aggName?: string;
  [key: string]: any;
  cmp?: (a: any, b: any) => number;
}

const RootContainer = styled.div`
  font-size: 12px;
`;

const aggregatorList: Option[] = [
  {
    id: "sum",
    name: "Sum",
  },
  {
    id: "mean",
    name: "Mean",
  },
  {
    id: "count",
    name: "Count",
  },
];

export interface DraggableFieldState {
  fields: Field[];
  rows: Field[];
  columns: Field[];
  measures: Field[];
}

const initDraggableState: DraggableFieldState = {
  fields: [],
  rows: [],
  columns: [],
  measures: [],
};

// const draggableStateKeys = Object.keys(initDraggableState) as Array<
//   keyof DraggableFieldState
// >;

const draggableStateKeys: Array<{ id: keyof DraggableFieldState; name: string }> = [
  { id: 'fields', name: 'Fields' },
  { id: 'columns', name: 'Columns' },
  { id: 'rows', name: 'Rows' },
  { id: 'measures', name: 'measures' }
];

export interface RecField {
  id: string;
  type: string;
}
interface DraggableFieldsProps {
  fields: Field[];
  highlightFields?: RecField[];
  onStateChange?: (state: DraggableFieldState) => void;
}

const DraggableFields: React.FC<DraggableFieldsProps> = (props) => {
  const { fields = [], onStateChange, highlightFields = [] } = props;
  const [state, setState] = useState<DraggableFieldState>({
    fields: [],
    rows: [],
    columns: [],
    measures: [],
  });
  useEffect(() => {
    setState({
      fields,
      rows: [],
      columns: [],
      measures: [],
    });
  }, [fields]);
  useEffect(() => {
    if (onStateChange) {
      onStateChange(state);
    }
  }, [state]);
  const onDragEnd = useCallback(
    (result: DropResult, provided: ResponderProvided) => {
      if (!result.destination) {
        return;
      }
      if (result.destination.droppableId === result.source.droppableId) {
        if (result.destination.index === result.source.index) return;
        setState((state) => {
          let listKey = result.destination
            .droppableId as keyof DraggableFieldState;
          let newList = reorder(
            state[listKey],
            result.source.index,
            result.destination.index
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
          let targetKey = result.destination
            .droppableId as keyof DraggableFieldState;
          let { originList, targetList } = move(
            state[sourceKey],
            result.source.index,
            state[targetKey],
            result.destination.index
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
        {draggableStateKeys.map((dkey) => (
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
                        let targetIndex = highlightFields.findIndex((h) => h.id === f.id);
                        return <FieldLabel
                          highlight={
                            targetIndex > -1
                          }
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          {
                            targetIndex > -1 &&
                              <div
                                className="ui green pointing below label"
                                style={{ position: 'absolute', zIndex: 99, top: '-36px', transform: 'translate(-50%, 0)', left: '10px' }}
                              >
                                {targetIndex + 1}:{InsightNameMap[highlightFields[targetIndex].type]}
                              </div>
                          }
                          {f.name}&nbsp;
                          {dkey.id === "measures" && (
                            <Select
                              options={aggregatorList}
                              value={f.aggName}
                              onChange={(value) => {
                                setState((state) => {
                                  const nextState = produce<
                                    DraggableFieldState
                                  >(state, (draft) => {
                                    draft[dkey.id][index].aggName = value;
                                  });
                                  return nextState;
                                });
                              }}
                            />
                          )}
                        </FieldLabel>
                      }}
                    </Draggable>
                  ))}
                </FieldsContainer>
              )}
            </Droppable>
          </FieldListContainer>
        ))}
      </DragDropContext>
    </RootContainer>
  );
};

export default DraggableFields;
