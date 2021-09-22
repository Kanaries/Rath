import React, { useMemo, useState } from 'react';
import { Field } from '../interfaces';
import { DraggableFieldState } from './index';

const INIT_DF_STATE: DraggableFieldState = {
    fields: [],
    rows: [],
    columns: [],
    color: [],
    opacity: [],
    size: [],
  };

export function useFieldsState() {
    const [fstate, setFstate] = useState<DraggableFieldState>(INIT_DF_STATE);
    const viewDimensions = useMemo<Field[]>(() => {
        return [
          ...fstate.rows,
          ...fstate.columns,
          ...fstate.color,
          ...fstate.opacity,
          ...fstate.size
        ].filter(f => f.type === 'D');
    }, [fstate])
      const viewMeasures = useMemo<Field[]>(() => {
        return [
          ...fstate.rows,
          ...fstate.columns,
          ...fstate.color,
          ...fstate.opacity,
          ...fstate.size,
        ].filter((f) => f.type === 'M');
    }, [fstate]);
    return {
        fstate,
        setFstate,
        viewDimensions,
        viewMeasures
    }
}