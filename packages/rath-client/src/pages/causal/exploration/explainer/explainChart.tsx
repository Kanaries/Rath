import React, { useRef, useEffect, useMemo } from 'react';
import type { View } from 'vega';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import embed from 'vega-embed';
import { Subject, throttleTime } from 'rxjs';
// import { EDITOR_URL } from '../../../../constants';
import type { IFieldMeta, IRow, IFilter } from '../../../../interfaces';
import { getRange, getVegaTimeFormatRules } from '../../../../utils';
import { SelectedFlag } from './RExplainer';

interface ExplainChartProps {
    title?: string;
    data: readonly IRow[];
    mainField: IFieldMeta;
    mainFieldAggregation: null | 'sum' | 'mean' | 'count';
    indexKey: IFieldMeta | null;
    subspace?: number[];
    interactive: boolean;
    handleFilter?: (filter: IFilter | null) => void;
    normalize: boolean;
}

const SELECT_SIGNAL_NAME = '__select__';
const SUBSPACE_KEY = '__subspace__';

const ExplainChart: React.FC<ExplainChartProps> = ({
    title, data, mainField, mainFieldAggregation, indexKey, subspace, interactive, handleFilter, normalize,
}) => {
    const container = useRef<HTMLDivElement>(null);
    const viewRef = useRef<View>();
    const handleFilterRef = useRef(handleFilter);
    handleFilterRef.current = handleFilter;

    const filterType = indexKey ? (
        indexKey.semanticType === 'quantitative' || indexKey.semanticType === 'temporal' ? 'interval' : 'point'
    ) : mainField.semanticType === 'quantitative' || mainField.semanticType === 'temporal' ? 'interval' : 'point';

    const source = useMemo(() => {
        return subspace ? data.map((row, i) => ({ ...row, [SUBSPACE_KEY]: subspace.includes(i) ? 1 : 0 })) : data;
    }, [data, subspace]);

    const dataRef = useRef(source);
    dataRef.current = source;

    useEffect(() => {
        const signalChange$ = new Subject<Parameters<NonNullable<typeof handleFilter>>[0]>();
        const updateSelect = signalChange$.pipe(throttleTime(100)).subscribe(predictor => {
            handleFilterRef.current?.(predictor);
        });
        if (container.current) {
            const commonEncodings = {
                mark: {
                    type: mainFieldAggregation ? (
                        indexKey ? indexKey.semanticType === 'temporal' : mainField.semanticType === 'temporal'
                    ) ? 'area' : 'bar' : 'point',
                    tooltip: true,
                },
                encoding: indexKey ? {
                    x: {
                        field: indexKey.fid,
                        bin: mainFieldAggregation && indexKey.semanticType === 'quantitative',
                        type: indexKey.semanticType,
                        title: indexKey.name || indexKey.fid,
                    },
                    y: {
                        field: mainField.fid,
                        aggregate: mainFieldAggregation ?? undefined,
                        type: mainField.semanticType,
                        title: mainFieldAggregation
                            ? `${mainFieldAggregation}(${mainField.name || mainField.fid})`
                            : mainField.name || mainField.fid,
                    },
                } : {
                    x: {
                        field: mainField.fid,
                        bin: mainField.semanticType === 'quantitative',
                        type: mainField.semanticType,
                        title: mainField.name || mainField.fid,
                    },
                    y: {
                        field: mainField.fid,
                        type: mainField.semanticType,
                        title: mainField.name || mainField.fid,
                        aggregate: mainFieldAggregation,
                    },
                },
            } as const;
            embed(container.current, {
                width: 200,
                height: 200,
                autosize: {
                    type: 'fit',
                    contains: 'padding',
                },
                title,
                data: {
                    // @ts-ignore
                    name: 'dataSource',
                    values: dataRef.current,
                },
                layer: subspace ? [
                    {
                        mark: commonEncodings.mark,
                        encoding: {
                            x: commonEncodings.encoding.x,
                            y: {
                                ...commonEncodings.encoding.y,
                                stack: mainFieldAggregation === 'mean' ? false : undefined,
                            },
                            color: {
                                field: SUBSPACE_KEY,
                                type: 'nominal',
                                legend: null,
                                scale: {
                                    domain: [0, 1, 2],
                                },
                            },
                        },
                    },
                ] : interactive ? [
                    {
                        params: [
                            {
                                name: SELECT_SIGNAL_NAME,
                                select: { type: filterType, encodings: ['x'] },
                            },
                        ],
                        mark: commonEncodings.mark,
                        encoding: {
                            ...commonEncodings.encoding,
                            color: { value: 'gray' },
                        },
                    },
                    {
                        transform: [
                            { filter: { param: SELECT_SIGNAL_NAME } },
                        ],
                        ...commonEncodings,
                    },
                ] : [{
                    mark: commonEncodings.mark,
                    encoding: {
                        ...commonEncodings.encoding,
                        y: {
                            ...commonEncodings.encoding.y,
                            stack: normalize ? 'normalize' : true,
                        },
                        color: {
                            field: SelectedFlag,
                            type: 'nominal',
                            legend: null,
                            scale: {
                                domain: [0, 1, 2],
                            },
                        },
                    },
                }],
                config: {
                    axis: {
                        labelLimit: 30,
                    },
                },
            }, {
                // editorUrl: EDITOR_URL,
                timeFormatLocale: getVegaTimeFormatRules(intl.get('time_format.langKey')) as any,
                actions: false,
            }).then((res) => {
                const view = res.view;
                viewRef.current = view;
                if (interactive) {
                    const handler = () => {
                        const state = res.view.getState().data[`${SELECT_SIGNAL_NAME}_store`][0];
                        if (state) {
                            switch (filterType) {
                                case 'interval': {
                                    const range = getRange(state.values[0]);
                                    if (indexKey) {
                                        signalChange$.next({
                                            type: 'range',
                                            fid: indexKey.fid,
                                            range,
                                        });
                                    }
                                    break;
                                }
                                case 'point': {
                                    const set = state.values as (string | number)[];
                                    if (indexKey) {
                                        signalChange$.next({
                                            type: 'set',
                                            fid: indexKey.fid,
                                            values: set,
                                        });
                                    } else {
                                        // 分箱的单变量分布
                                        signalChange$.next({
                                            type: 'set',
                                            fid: mainField.fid,
                                            values: set,
                                        });
                                    }
                                    break;
                                }
                                default: {
                                    signalChange$.next(null);
                                    break;
                                }
                            }
                        } else {
                            signalChange$.next(null);
                        }
                    };
                    res.view.addSignalListener(SELECT_SIGNAL_NAME, handler);
                }
            });
        }
        return () => {
            updateSelect.unsubscribe();
            if (viewRef.current) {
                viewRef.current.finalize();
                viewRef.current = undefined;
            }
        };
    }, [title, mainField, mainFieldAggregation, filterType, interactive, indexKey, normalize, subspace]);

    useEffect(() => {
        viewRef.current?.change(
            'dataSource',
            viewRef.current.changeset().remove(() => true).insert(source),
        );
    }, [source]);

    return <div ref={container} />;
};

export default observer(ExplainChart);
