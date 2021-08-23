import React, { useEffect, useRef } from 'react';
import { Field, Record } from '../interfaces';
import embed from 'vega-embed';
import { Subject } from 'rxjs'
import * as op from 'rxjs/operators';
import { ScenegraphEvent } from 'vega';
const SELECTION_NAME = 'geom';
interface ReactVegaProps {
  rows: Field[];
  columns: Field[];
  dataSource: Record[];
  defaultAggregate?: boolean;
  geomType: string;
  color?: Field;
  opacity?: Field;
  size?: Field;
  onGeomClick?: (values: any, e: any) => void
}
const NULL_FIELD: Field = {
  id: '',
  name: '',
  aggName: 'sum',
  type: 'D'
}
const click$ = new Subject<ScenegraphEvent>();
const selection$ = new Subject<any>();
const geomClick$ = selection$.pipe(
  op.withLatestFrom(click$),
  op.filter(([values, _]) => {
    if (Object.keys(values).length > 0) {
      return true
    }
    return false
  })
);
function getFieldType (field: Field): 'quantitative' | 'nominal' | 'ordinal' | 'temporal' {
  if (field.type === 'M') return 'quantitative';
  return 'nominal';
}
const ReactVega: React.FC<ReactVegaProps> = props => {
  const {
    dataSource = [],
    rows = [],
    columns = [],
    defaultAggregate = true,
    geomType,
    color,
    opacity,
    size,
    onGeomClick
  } = props;
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const clickSub = geomClick$.subscribe(([values, e]) => {
      if (onGeomClick) {
        onGeomClick(values, e);
      }
    })
    return () => {
      clickSub.unsubscribe();
    }
  }, []);
  useEffect(() => {
    if (container.current) {
      const yField = rows.length > 0 ? rows[rows.length - 1] : NULL_FIELD;
      const xField = columns.length > 0 ? columns[columns.length - 1] : NULL_FIELD;
      const rowField = rows.length > 1 ? rows[rows.length - 2] : NULL_FIELD;
      const columnField = columns.length > 1 ? columns[columns.length - 2] : NULL_FIELD;
      const dimensions = [...rows, ...columns, color, opacity, size].filter(f => Boolean(f)).map(f => (f as Field).id)
      embed(container.current, {
        data: {
          values: dataSource,
        },
        mark: geomType as any,
        selection: {
          [SELECTION_NAME]: {
            type: 'single',
            fields: dimensions
          }
        },
        encoding: {
          x: {
            field: xField.id,
            type: getFieldType(xField),
            aggregate:
              xField.type === 'M' &&
              defaultAggregate &&
              (xField.aggName as any),
          },
          y: {
            field: yField.id,
            type: getFieldType(yField),
            aggregate:
              yField.type === 'M' &&
              defaultAggregate &&
              (yField.aggName as any),
          },
          row: rowField !== NULL_FIELD ? {
            field: rowField.id,
            type: getFieldType(rowField),
          } : undefined,
          column: columnField !== NULL_FIELD ? {
            field: columnField.id,
            type: getFieldType(columnField),
          } : undefined,
          color: color && {
            field: color.id,
            type: getFieldType(color)
          },
          opacity: opacity && {
            field: opacity.id,
            type: getFieldType(opacity)
          },
          size: size && {
            field: size.id,
            type: getFieldType(size)
          }
        },
      }, { mode: 'vega-lite', actions: false }).then(res => {
        res.view.addEventListener('click', (e) => {
          click$.next(e);
        })
        res.view.addSignalListener(SELECTION_NAME, (name: any, values: any) => {
          selection$.next(values);
        });
      });
    }
  }, [dataSource, rows, columns, defaultAggregate, geomType, color, opacity, size]);
  return <div ref={container}></div>
}

export default ReactVega;
