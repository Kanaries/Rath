import React, { useEffect, useState, useMemo } from 'react';
import { IField, Record } from '../interfaces';
import embed from 'vega-embed';
import { Subject } from 'rxjs'
import * as op from 'rxjs/operators';
import { ScenegraphEvent } from 'vega';
import { autoMark } from '../utils/autoMark';
import { ISemanticType } from 'visual-insights';

const SELECTION_NAME = 'geom';
interface ReactVegaProps {
  rows: IField[];
  columns: IField[];
  dataSource: Record[];
  defaultAggregate?: boolean;
  defaultStack?: boolean;
  geomType: string;
  color?: IField;
  opacity?: IField;
  size?: IField;
  onGeomClick?: (values: any, e: any) => void
}
const NULL_FIELD: IField = {
  fid: '',
  name: '',
  semanticType: 'quantitative',
  analyticType: 'measure',
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
function getFieldType(field: IField): 'quantitative' | 'nominal' | 'ordinal' | 'temporal' {
  return field.semanticType
}

interface SingleViewProps {
  xField: IField;
  yField: IField;
  color: IField;
  opacity: IField;
  size: IField;
  xOffset: IField;
  yOffset: IField;
  row: IField;
  col: IField;
  defaultAggregated: boolean;
  defaultStack: boolean;
  geomType: string;

}
function getSingleView(props: SingleViewProps) {
  const {
    xField,
    yField,
    color,
    opacity,
    size,
    row,
    col,
    // xOffset,
    // yOffset,
    defaultAggregated,
    defaultStack,
    geomType
  } = props
  const xFieldAgg = (xField.type === 'M' && defaultAggregated && (xField.aggName as any));
  const yFieldAgg = (yField.type === 'M' && defaultAggregated && (yField.aggName as any)) ;
  let markType = geomType;
  if (geomType === 'auto') {
    const types: ISemanticType[] = [];
    if (xField !== NULL_FIELD) types.push(xField.semanticType)//types.push(getFieldType(xField));
    if (yField !== NULL_FIELD) types.push(yField.semanticType)//types.push(getFieldType(yField));
    markType = autoMark(types);
  }

  const spec = {
    mark: {
      type: markType,
      opacity: 0.96
    },
    encoding: {
      x: {
        field: xField.fid,
        type: getFieldType(xField),
        aggregate: xFieldAgg,
        stack: defaultStack,
        title: xFieldAgg ? `${xField.aggName}(${xField.name})` : xField.name
      },
      y: {
        field: yField.fid,
        type: getFieldType(yField),
        aggregate: yFieldAgg,
        stack: defaultStack,
        title: yFieldAgg ? `${yField.aggName}(${yField.name})` : yField.name
      },
      row: row !== NULL_FIELD ? {
        field: row.fid,
        type: getFieldType(row),
        title: row.name
      } : undefined,
      // TODO: xOffset等通道的特性不太稳定，建议后续vega相关特性稳定后，再使用。
      // 1. 场景太细，仅仅对对应的坐标轴是nominal(可能由ordinal)时，才可用
      // 2. 部分geom type会出现bug，如line，会出现组间的错误连接
      // "vega": "^5.22.0",
      // "vega-embed": "^6.20.8",
      // "vega-lite": "^5.2.0",
      // ```ts
      // xOffset: xOffset !== NULL_FIELD ? {
      //   field: xOffset.fid,
      //   type: getFieldType(xOffset),
      // } : undefined,
      // yOffset: yOffset !== NULL_FIELD ? {
      //   field: yOffset.fid,
      //   type: getFieldType(yOffset),
      // } : undefined,
      // ```
      column: col !== NULL_FIELD ? {
        field: col.fid,
        type: getFieldType(col),
        name: col.name
      } : undefined,
      color: color !== NULL_FIELD ? {
        field: color.fid,
        type: getFieldType(color),
        color: color.name
      } : undefined,
      opacity: opacity !== NULL_FIELD ? {
        field: opacity.fid,
        type: getFieldType(opacity),
        name: opacity.name
      } : undefined,
      size: size !== NULL_FIELD ? {
        field: size.fid,
        type: getFieldType(size),
        name: size.name
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
  const allFieldIds = useMemo(() => [...rows, ...columns, color, opacity, size].filter(f => Boolean(f)).map(f => (f as IField).fid), [rows, columns, color, opacity, size]);


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
      const singleView = getSingleView({
        xField,
        yField,
        color: color ? color : NULL_FIELD,
        opacity: opacity ? opacity : NULL_FIELD,
        size: size ? size : NULL_FIELD,
        row: rowFacetField,
        col: colFacetField,
        xOffset: NULL_FIELD,
        yOffset: NULL_FIELD,
        defaultAggregated: defaultAggregate,
        defaultStack,
        geomType
      });
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
          const singleView = getSingleView({
            xField: colRepeatFields[j] || NULL_FIELD,
            yField: rowRepeatFields[i] || NULL_FIELD,
            color: color ? color : NULL_FIELD,
            opacity: opacity ? opacity : NULL_FIELD,
            size: size ? size : NULL_FIELD,
            row: rowFacetField,
            col: colFacetField,
            xOffset: NULL_FIELD,
            yOffset: NULL_FIELD,
            defaultAggregated: defaultAggregate,
            defaultStack,
            geomType
          });
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
