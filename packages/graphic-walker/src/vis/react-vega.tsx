import React, { useEffect, useState, useMemo } from 'react';
import { IViewField, IRow, IStackMode } from '../interfaces';
import embed from 'vega-embed';
import { Subject } from 'rxjs'
import * as op from 'rxjs/operators';
import { ScenegraphEvent } from 'vega';
import { autoMark } from '../utils/autoMark';
import { ISemanticType } from 'visual-insights';
import styled from 'styled-components';
import { COUNT_FIELD_ID } from '../constants';

const CanvaContainer = styled.div<{rowSize: number; colSize: number;}>`
  display: grid;
  grid-template-columns: repeat(${props => props.colSize}, 1fr);
  grid-template-rows: repeat(${props => props.rowSize}, 1fr);
`

const SELECTION_NAME = 'geom';
interface ReactVegaProps {
  rows: Readonly<IViewField[]>;
  columns: Readonly<IViewField[]>;
  dataSource: IRow[];
  defaultAggregate?: boolean;
  stack: IStackMode;
  interactiveScale: boolean;
  geomType: string;
  color?: IViewField;
  opacity?: IViewField;
  size?: IViewField;
  shape?: IViewField;
  theta?: IViewField;
  radius?: IViewField;
  showActions: boolean;
  layoutMode: string;
  width: number;
  height: number;
  onGeomClick?: (values: any, e: any) => void
}
const NULL_FIELD: IViewField = {
  dragId: '',
  fid: '',
  name: '',
  semanticType: 'quantitative',
  analyticType: 'measure',
  aggName: 'sum'
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
function getFieldType(field: IViewField): 'quantitative' | 'nominal' | 'ordinal' | 'temporal' {
  return field.semanticType
}
interface SingleViewProps {
  x: IViewField;
  y: IViewField;
  color: IViewField;
  opacity: IViewField;
  size: IViewField;
  shape: IViewField,
  xOffset: IViewField;
  yOffset: IViewField;
  row: IViewField;
  column: IViewField;
  theta: IViewField;
  radius: IViewField;
  defaultAggregated: boolean;
  stack: IStackMode;
  geomType: string;
}

function availableChannels (geomType: string): Set<string> {
  if (geomType === 'arc') {
    return new Set(['opacity', 'color', 'size', 'theta', 'radius'])
  }
  return new Set(['column', 'opacity', 'color', 'row', 'size', 'x', 'y', 'xOffset', 'yOffset', 'shape'])
}
interface EncodeProps extends Pick<SingleViewProps, 'column' | 'opacity' | 'color' | 'row' | 'size' | 'x' | 'y' | 'xOffset' | 'yOffset' | 'shape' | 'theta' | 'radius'> {
  geomType: string;
}
function channelEncode(props: EncodeProps) {
  const avcs = availableChannels(props.geomType)
  const encoding: {[key: string]: any} = {}
  Object.keys(props).filter(c => avcs.has(c)).forEach(c => {
    if (props[c] !== NULL_FIELD) {
      encoding[c] = {
        field: props[c].fid,
        title: props[c].name,
        type: props[c].semanticType
      }
      if (props[c].semanticType === 'temporal') {
        encoding[c].axis = { format: '%Y-%m' }
      }
    }
  })
  // FIXME: 临时处理逻辑，只处理xy排序
  if (encoding.x && encoding.y) {
    if ((props.x.sort && props.x.sort) || (props.y && props.y.sort)) {
      if (props.x.sort !== 'none' && (props.y.sort === 'none' || !Boolean(props.y.sort)))  {
        encoding.x.sort = {
          encoding: 'y',
          order: props.x.sort
        }
      } else if (props.y.sort && props.y.sort !== 'none' && (props.x.sort === 'none' || !Boolean(props.x.sort)))  {
        encoding.y.sort = {
          encoding: 'x',
          order: props.y.sort
        }
      }
    }
  }
  return encoding
}
function channelAggregate(encoding: {[key: string]: any}, fields: IViewField[]) {
  Object.values(encoding).forEach(c => {
    const targetField = fields.find(f => f.fid === c.field);
    if (targetField && targetField.fid === COUNT_FIELD_ID) {
      c.field = undefined;
      c.aggregate = 'count';
      c.title = 'Count'
    } else if (targetField && targetField.analyticType === 'measure') {
      c.title = `${targetField.aggName}(${targetField.name})`;
      c.aggregate = targetField.aggName;
    }
  })
}
function channelStack(encoding: {[key: string]: any}, stackMode: IStackMode) {
  if (stackMode === 'stack') return;
  if (encoding.x && encoding.x.type === 'quantitative') {
    encoding.x.stack = stackMode === 'none' ? null : 'normalize'
  }
  if (encoding.y && encoding.y.type === 'quantitative') {
    encoding.y.stack = stackMode === 'none' ? null : 'normalize'
  }
}
// TODO: xOffset等通道的特性不太稳定，建议后续vega相关特性稳定后，再使用。
// 1. 场景太细，仅仅对对应的坐标轴是nominal(可能由ordinal)时，才可用
// 2. 部分geom type会出现bug，如line，会出现组间的错误连接
// "vega": "^5.22.0",
// "vega-embed": "^6.20.8",
// "vega-lite": "^5.2.0",
function getSingleView(props: SingleViewProps) {
  const {
    x,
    y,
    color,
    opacity,
    size,
    shape,
    theta,
    radius,
    row,
    column,
    xOffset,
    yOffset,
    defaultAggregated,
    stack,
    geomType
  } = props
  const fields: IViewField[] = [x, y, color, opacity, size, shape, row, column, xOffset, yOffset, theta, radius]
  let markType = geomType;
  if (geomType === 'auto') {
    const types: ISemanticType[] = [];
    if (x !== NULL_FIELD) types.push(x.semanticType)//types.push(getFieldType(x));
    if (y !== NULL_FIELD) types.push(y.semanticType)//types.push(getFieldType(yField));
    markType = autoMark(types);
  }

  let encoding = channelEncode({ geomType: markType, x, y, color, opacity, size, shape, row, column, xOffset, yOffset, theta, radius })
  if (defaultAggregated) {
    channelAggregate(encoding, fields);
  }
  channelStack(encoding, stack);
  const spec = {
    mark: {
      type: markType,
      opacity: 0.96,
      tooltip: true
    },
    encoding
  };
  return spec;
}
const ReactVega: React.FC<ReactVegaProps> = props => {
  const {
    dataSource = [],
    rows = [],
    columns = [],
    defaultAggregate = true,
    stack = 'stack',
    geomType,
    color,
    opacity,
    size,
    theta,
    radius,
    shape,
    onGeomClick,
    showActions,
    interactiveScale,
    layoutMode,
    width,
    height
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
  const rowDims = useMemo(() => rows.filter(f => f.analyticType === 'dimension'), [rows]);
  const colDims = useMemo(() => columns.filter(f => f.analyticType === 'dimension'), [columns]);
  const rowMeas = useMemo(() => rows.filter(f => f.analyticType === 'measure'), [rows]);
  const colMeas = useMemo(() => columns.filter(f => f.analyticType === 'measure'), [columns]);
  const rowFacetFields = useMemo(() => rowDims.slice(0, -1), [rowDims]);
  const colFacetFields = useMemo(() => colDims.slice(0, -1), [colDims]);
  const rowRepeatFields = useMemo(() => rowMeas.length === 0 ? rowDims.slice(-1) : rowMeas, [rowDims, rowMeas]);//rowMeas.slice(0, -1);
  const colRepeatFields = useMemo(() => colMeas.length === 0 ? colDims.slice(-1) : colMeas, [rowDims, rowMeas]);//colMeas.slice(0, -1);
  const allFieldIds = useMemo(() => [...rows, ...columns, color, opacity, size].filter(f => Boolean(f)).map(f => (f as IViewField).fid), [rows, columns, color, opacity, size]);


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

    const rowLeftFacetFields = rows.slice(0, -1).filter(f => f.analyticType === 'dimension');
    const colLeftFacetFields = columns.slice(0, -1).filter(f => f.analyticType === 'dimension');

    const rowFacetField = rowLeftFacetFields.length > 0 ? rowLeftFacetFields[rowLeftFacetFields.length - 1] : NULL_FIELD;
    const colFacetField = colLeftFacetFields.length > 0 ? colLeftFacetFields[colLeftFacetFields.length - 1] : NULL_FIELD;

    const spec: any = {
      data: {
        values: dataSource,
      },
      params: [{
        name: SELECTION_NAME,
        select: {
          type: 'point',
          fields: allFieldIds
        }
      }]
    };
    if (interactiveScale) {
      spec.params.push({
        name: "grid",
        select: "interval",
        bind: "scales"
      })
    }
    if (rowRepeatFields.length <= 1 && colRepeatFields.length <= 1) {
      if (layoutMode === 'fixed') {
        if (rowFacetField === NULL_FIELD && colFacetField === NULL_FIELD) {
          spec.autosize = 'fit'
        }
        spec.width = width;
        spec.height = height;
      }
      const singleView = getSingleView({
        x: xField,
        y: yField,
        color: color ? color : NULL_FIELD,
        opacity: opacity ? opacity : NULL_FIELD,
        size: size ? size : NULL_FIELD,
        shape: shape ? shape : NULL_FIELD,
        theta: theta ? theta : NULL_FIELD,
        radius: radius ? radius : NULL_FIELD,
        row: rowFacetField,
        column: colFacetField,
        xOffset: NULL_FIELD,
        yOffset: NULL_FIELD,
        defaultAggregated: defaultAggregate,
        stack,
        geomType
      });
      // if (layoutMode === 'fixed') {
      //   spec.width = 800;
      //   spec.height = 600;
      // }
      spec.mark = singleView.mark;
      spec.encoding = singleView.encoding;
      if (viewPlaceholders.length > 0 && viewPlaceholders[0].current) {
        embed(viewPlaceholders[0].current, spec, { mode: 'vega-lite', actions: showActions }).then(res => {
          try {
            res.view.addEventListener('click', (e) => {
              click$.next(e);
            })
            res.view.addSignalListener(SELECTION_NAME, (name: any, values: any) => {
              selection$.next(values);
            }); 
          } catch (error) {
            console.warn(error)
          }
        });
      }
    } else {
      if (layoutMode === 'fixed') {
        spec.width = Math.floor(width / colRepeatFields.length) - 5;
        spec.height = Math.floor(height / rowRepeatFields.length) - 5;
        spec.autosize = 'fit'
      }
      for (let i = 0; i < rowRepeatFields.length; i++) {
        for (let j = 0; j < colRepeatFields.length; j++) {
          const singleView = getSingleView({
            x: colRepeatFields[j] || NULL_FIELD,
            y: rowRepeatFields[i] || NULL_FIELD,
            color: color ? color : NULL_FIELD,
            opacity: opacity ? opacity : NULL_FIELD,
            size: size ? size : NULL_FIELD,
            shape: shape ? shape : NULL_FIELD,
            theta: theta ? theta : NULL_FIELD,
            radius: radius ? radius : NULL_FIELD,
            row: rowFacetField,
            column: colFacetField,
            xOffset: NULL_FIELD,
            yOffset: NULL_FIELD,
            defaultAggregated: defaultAggregate,
            stack,
            geomType
          });
          const node = i * colRepeatFields.length + j < viewPlaceholders.length ? viewPlaceholders[i * colRepeatFields.length + j].current : null
          const ans = { ...spec, ...singleView }
          if (node) {
            embed(node, ans, { mode: 'vega-lite', actions: showActions }).then(res => {
              try {
                res.view.addEventListener('click', (e) => {
                  click$.next(e);
                })
                res.view.addSignalListener(SELECTION_NAME, (name: any, values: any) => {
                  selection$.next(values);
                }); 
              } catch (error) {
                console.warn(error);
              }
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
    shape,
    theta, radius,
    viewPlaceholders,
    rowFacetFields,
    colFacetFields,
    rowRepeatFields,
    colRepeatFields,
    stack,
    showActions,
    interactiveScale,
    layoutMode,
    width,
    height
  ]);

  return <CanvaContainer rowSize={Math.max(rowRepeatFields.length, 1)} colSize={Math.max(colRepeatFields.length, 1)}>
    {/* <div ref={container}></div> */}
    {
      viewPlaceholders.map((view, i) => <div key={i} ref={view}></div>)
    }
  </CanvaContainer>
}

export default ReactVega;
