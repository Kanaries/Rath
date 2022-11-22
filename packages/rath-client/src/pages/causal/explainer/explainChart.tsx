import React, { useRef, useEffect } from 'react';
import type { View } from 'vega';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import embed from 'vega-embed';
import { Subject, throttleTime } from 'rxjs';
import { EDITOR_URL } from '../../../constants';
import type { IFieldMeta, IRow, IFilter } from '../../../interfaces';
import { getRange } from '../../../utils';
import { SelectedFlag } from './RExplainer';

interface ExplainChartProps {
    data: IRow[];
    mainField: IFieldMeta;
    mainFieldAggregation: null | 'sum' | 'mean' | 'count';
    indexKey: IFieldMeta | string;
    interactive: boolean;
    handleFilter?: (filter: IFilter | null) => void;
}

const SELECT_SIGNAL_NAME = '__select__';

const ExplainChart: React.FC<ExplainChartProps> = ({ data, mainField, mainFieldAggregation, indexKey, interactive, handleFilter }) => {
    const container = useRef<HTMLDivElement>(null);
    const viewRef = useRef<View>();
    const handleFilterRef = useRef(handleFilter);
    handleFilterRef.current = handleFilter;

    const filterType = mainField.semanticType === 'quantitative' || mainField.semanticType === 'temporal' ? 'interval' : 'point';

    useEffect(() => {
        const signalChange$ = new Subject<Parameters<NonNullable<typeof handleFilter>>[0]>();
        const updateSelect = signalChange$.pipe(throttleTime(100)).subscribe(predictor => {
            handleFilterRef.current?.(predictor);
        });
        if (container.current) {
            const commonEncodings = {
                mark: {
                    type: 'bar',
                    tooltip: true,
                },
                encoding: {
                    x: {
                        field: typeof indexKey === 'string' ? indexKey : indexKey.fid,
                        bin: typeof indexKey === 'string' ? undefined : (
                            indexKey.semanticType === 'quantitative' || indexKey.semanticType === 'temporal'
                        ),
                        type: typeof indexKey === 'string' ? 'quantitative' : indexKey.semanticType,
                    },
                    y: {
                        field: mainField.fid,
                        aggregate: mainFieldAggregation ?? undefined,
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
                data: {
                    // @ts-ignore
                    name: 'dataSource',
                    values: data,
                },
                layer: interactive ? [
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
                            stack: 'normalize',
                        },
                        color: {
                            field: SelectedFlag,
                            type: 'nominal',
                            legend: null,
                        },
                    },
                }],
                config: {
                    axis: {
                        labelLimit: 30,
                    },
                },
            }, {
                editorUrl: EDITOR_URL,
                timeFormatLocale: intl.get('time_format') as any,
                actions: true,
            }).then((res) => {
                const view = res.view;
                viewRef.current = view;
                if (interactive) {
                    const handler = () => {
                        const state = res.view.getState().data[`${SELECT_SIGNAL_NAME}_store`][0];
                        if (state) {
                            switch (filterType) {
                                case 'interval': {
                                    const range = getRange(state.values[0].map((d: unknown) => typeof d === 'object' ? (d as Date).getTime() : Number(d)));
                                    signalChange$.next({
                                        type: 'range',
                                        fid: typeof indexKey === 'string' ? indexKey : indexKey.fid,
                                        range,
                                    });
                                    break;
                                }
                                case 'point': {
                                    const set = state.values as (string | number)[];
                                    signalChange$.next({
                                        type: 'set',
                                        fid: typeof indexKey === 'string' ? indexKey : indexKey.fid,
                                        values: set,
                                    });
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
    }, [mainField, mainFieldAggregation, filterType, interactive, data, indexKey]);

    return <div ref={container} />;
};

export default observer(ExplainChart);
