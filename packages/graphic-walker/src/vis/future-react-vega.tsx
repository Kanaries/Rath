/**
 * TODO: This file will be used when vega-lite facets bug is fixed.
 * https://github.com/vega/vega-lite/issues/4680
 */
import React, { useEffect, useRef } from 'react';
import { IField, IViewField, Record } from '../interfaces';
import embed from 'vega-embed';
import { Subject } from 'rxjs'
import * as op from 'rxjs/operators';
import { ScenegraphEvent } from 'vega';
const SELECTION_NAME = 'geom';
interface ReactVegaProps {
    rows: IField[];
    columns: IField[];
    dataSource: Record[];
    defaultAggregate?: boolean;
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
function getFieldType(field: IField): 'quantitative' | 'nominal' | 'ordinal' | 'temporal' {
    if (field.analyticType === 'measure') return 'quantitative';
    return 'nominal';
}

function getSingleView(xField: IField, yField: IField, color: IField, opacity: IField, size: IField, row: IField, col: IField, defaultAggregated: boolean, geomType: string) {
    return {
        mark: geomType,
        encoding: {
            x: {
                field: xField.fid,
                type: getFieldType(xField),
                aggregate:
                    xField.analyticType === 'measure' &&
                    defaultAggregated &&
                    (xField.aggName as any),
            },
            y: {
                field: yField.fid,
                type: getFieldType(yField),
                aggregate:
                    yField.analyticType === 'measure' &&
                    defaultAggregated &&
                    (yField.aggName as any),
            },
            row: row !== NULL_FIELD ? {
                field: row.fid,
                type: getFieldType(row),
            } : undefined,
            column: col !== NULL_FIELD ? {
                field: col.fid,
                type: getFieldType(col),
            } : undefined,
            color: color !== NULL_FIELD ? {
                field: color.fid,
                type: getFieldType(color)
            } : undefined,
            opacity: opacity !== NULL_FIELD ? {
                field: opacity.fid,
                type: getFieldType(opacity)
            } : undefined,
            size: size !== NULL_FIELD ? {
                field: size.fid,
                type: getFieldType(size)
            } : undefined
        }
    };
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
            const rowDims = rows.filter(f => f.analyticType === 'dimension');
            const colDims = columns.filter(f => f.analyticType === 'dimension');
            const rowMeas = rows.filter(f => f.analyticType === 'measure');
            const colMeas = columns.filter(f => f.analyticType === 'measure');

            const yField = rows.length > 0 ? rows[rows.length - 1] : NULL_FIELD;
            const xField = columns.length > 0 ? columns[columns.length - 1] : NULL_FIELD;

            const rowFacetFields = rowDims.slice(0, -1);
            const colFacetFields = colDims.slice(0, -1);
            const rowFacetField = rowFacetFields.length > 0 ? rowFacetFields[rowFacetFields.length - 1] : NULL_FIELD;
            const colFacetField = colFacetFields.length > 0 ? colFacetFields[colFacetFields.length - 1] : NULL_FIELD;

            const rowRepeatFields = rowMeas.length === 0 ? rowDims.slice(-1) : rowMeas;//rowMeas.slice(0, -1);
            const colRepeatFields = colMeas.length === 0 ? colDims.slice(-1) : colMeas;//colMeas.slice(0, -1);

            const rowRepeatField = rowRepeatFields.length > 0 ? rowRepeatFields[rowRepeatFields.length - 1] : NULL_FIELD;
            const colRepeatField = colRepeatFields.length > 0 ? colRepeatFields[colRepeatFields.length - 1] : NULL_FIELD;

            const dimensions = [...rows, ...columns, color, opacity, size].filter(f => Boolean(f)).map(f => (f as IField).fid)

            const spec: any = {
                data: {
                    values: dataSource,
                },
                selection: {
                    [SELECTION_NAME]: {
                        type: 'single',
                        fields: dimensions
                    }
                }
            };
            if (false) {
                // const singleView = getSingleView(
                //   xField,
                //   yField,
                //   color ? color : NULL_FIELD,
                //   opacity ? opacity : NULL_FIELD,
                //   size ? size : NULL_FIELD,
                //   rowFacetField,
                //   colFacetField,
                //   defaultAggregate,
                //   geomType
                // );
                // spec.mark = singleView.mark;
                // spec.encoding = singleView.encoding;
            } else {
                spec.concat = [];
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
                            geomType
                        );
                        spec.concat.push(singleView)
                    }
                }
            }
            embed(container.current, spec, { mode: 'vega-lite', actions: false }).then(res => {
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
