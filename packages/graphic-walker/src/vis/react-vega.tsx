import React, { useEffect, useState, useMemo } from 'react';
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
  defaultStack?: boolean;
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
function getFieldType(field: Field): 'quantitative' | 'nominal' | 'ordinal' | 'temporal' {
  if (field.type === 'M') return 'quantitative';
  return 'nominal';
}

function getSingleView(xField: Field, yField: Field, color: Field, opacity: Field, size: Field, row: Field, col: Field, defaultAggregated: boolean, defaultStack: boolean, geomType: string) {
  const xFieldAgg = (xField.type === 'M' && defaultAggregated && (xField.aggName as any));
  const yFieldAgg = (yField.type === 'M' && defaultAggregated && (yField.aggName as any)) ;

  const spec = {
    mark: {
      type: geomType,
      opacity: 0.96
    },
    encoding: {
      x: {
        field: xField.id,
        type: getFieldType(xField),
        aggregate: xFieldAgg,
        stack: defaultStack
      },
      y: {
        field: yField.id,
        type: getFieldType(yField),
        aggregate: yFieldAgg,
        stack: defaultStack
      },
      row: row !== NULL_FIELD ? {
        field: row.id,
        type: getFieldType(row),
      } : undefined,
      column: col !== NULL_FIELD ? {
        field: col.id,
        type: getFieldType(col),
      } : undefined,
      color: color !== NULL_FIELD ? {
        field: color.id,
        type: getFieldType(color)
      } : undefined,
      opacity: opacity !== NULL_FIELD ? {
        field: opacity.id,
        type: getFieldType(opacity)
      } : undefined,
      size: size !== NULL_FIELD ? {
        field: size.id,
        type: getFieldType(size)
      } : undefined
    }
  };
  return spec;
}
const ReactVega: React.FC<ReactVegaProps> = props => {
  const {
    dataSource = [],
    rows = [],
    columns = [],
    defaultAggregate = true,
    defaultStack = true,
    geomType,
    color,
    opacity,
    size,
    onGeomClick
  } = props;
  // const container = useRef<HTMLDivElement>(null);
  // const containers = useRef<(HTMLDivElement | null)[]>([]);
  const [viewPlaceholders, setViewPlaceholders] = useState<React.MutableRefObject<HTMLDivElement>[]>([]);
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
  const rowDims = useMemo(() => rows.filter(f => f.type === 'D'), [rows]);
  const colDims = useMemo(() => columns.filter(f => f.type === 'D'), [columns]);
  const rowMeas = useMemo(() => rows.filter(f => f.type === 'M'), [rows]);
  const colMeas = useMemo(() => columns.filter(f => f.type === 'M'), [columns]);
  const rowFacetFields = useMemo(() => rowDims.slice(0, -1), [rowDims]);
  const colFacetFields = useMemo(() => colDims.slice(0, -1), [colDims]);
  const rowRepeatFields = useMemo(() => rowMeas.length === 0 ? rowDims.slice(-1) : rowMeas, [rowDims, rowMeas]);//rowMeas.slice(0, -1);
  const colRepeatFields = useMemo(() => colMeas.length === 0 ? colDims.slice(-1) : colMeas, [rowDims, rowMeas]);//colMeas.slice(0, -1);
  const allFieldIds = useMemo(() => [...rows, ...columns, color, opacity, size].filter(f => Boolean(f)).map(f => (f as Field).id), [rows, columns, color, opacity, size]);


  useEffect(() => {
    setViewPlaceholders(views => {
      const viewNum = Math.max(1, rowRepeatFields.length * colRepeatFields.length)
      const nextViews = new Array(viewNum).fill(null).map((v, i) => views[i] || React.createRef())
      return nextViews;
    })
  }, [rowRepeatFields, colRepeatFields])

  useEffect(() => {

    const yField = rows.length > 0 ? rows[rows.length - 1] : NULL_FIELD;
    const xField = columns.length > 0 ? columns[columns.length - 1] : NULL_FIELD;

    const rowLeftFacetFields = rows.slice(0, -1).filter(f => f.type === 'D');
    const colLeftFacetFields = columns.slice(0, -1).filter(f => f.type === 'D');

    const rowFacetField = rowLeftFacetFields.length > 0 ? rowLeftFacetFields[rowLeftFacetFields.length - 1] : NULL_FIELD;
    const colFacetField = colLeftFacetFields.length > 0 ? colLeftFacetFields[colLeftFacetFields.length - 1] : NULL_FIELD;

    const spec: any = {
      data: {
        values: dataSource,
      },
      selection: {
        [SELECTION_NAME]: {
          type: 'single',
          fields: allFieldIds
        }
      }
    };
    if (rowRepeatFields.length <= 1 && colRepeatFields.length <= 1) {
      const singleView = getSingleView(
        xField,
        yField,
        color ? color : NULL_FIELD,
        opacity ? opacity : NULL_FIELD,
        size ? size : NULL_FIELD,
        rowFacetField,
        colFacetField,
        defaultAggregate,
        defaultStack,
        geomType
      );
      spec.mark = singleView.mark;
      spec.encoding = singleView.encoding;
      if (viewPlaceholders.length > 0 && viewPlaceholders[0].current) {
        embed(viewPlaceholders[0].current, spec, { mode: 'vega-lite', actions: false }).then(res => {
          res.view.addEventListener('click', (e) => {
            click$.next(e);
          })
          res.view.addSignalListener(SELECTION_NAME, (name: any, values: any) => {
            selection$.next(values);
          });
        });
      }
    } else {
      for (let i = 0; i < rowRepeatFields.length; i++) {
        for (let j = 0; j < colRepeatFields.length; j++) {
          const singleView = getSingleView(
            colRepeatFields[j] || NULL_FIELD,
            rowRepeatFields[i] || NULL_FIELD,
            color ? color : NULL_FIELD,
            opacity ? opacity : NULL_FIELD,
            size ? size : NULL_FIELD,
            rowFacetField,
            colFacetField,
            defaultAggregate,
            defaultStack,
            geomType
          );
          const node = i * colRepeatFields.length + j < viewPlaceholders.length ? viewPlaceholders[i * colRepeatFields.length + j].current : null
          const ans = { ...spec, ...singleView }
          if (node) {
            embed(node, ans, { mode: 'vega-lite', actions: false }).then(res => {
              res.view.addEventListener('click', (e) => {
                click$.next(e);
              })
              res.view.addSignalListener(SELECTION_NAME, (name: any, values: any) => {
                selection$.next(values);
              });
            })
          }
        }
      }
    }

  }, [
    dataSource,
    allFieldIds,
    rows,
    columns,
    defaultAggregate,
    geomType,
    color,
    opacity,
    size,
    viewPlaceholders,
    rowFacetFields,
    colFacetFields,
    rowRepeatFields,
    colRepeatFields,
    defaultStack
  ]);
  return <div>
    {/* <div ref={container}></div> */}
    {
      viewPlaceholders.map((view, i) => <div key={i} ref={view}></div>)
    }
  </div>
}

export default ReactVega;
