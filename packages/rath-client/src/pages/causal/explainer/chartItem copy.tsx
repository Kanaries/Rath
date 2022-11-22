import React, { useRef, useEffect } from 'react';
import type { View } from 'vega';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import embed from 'vega-embed';
import { Subject, throttleTime } from 'rxjs';
import { EDITOR_URL } from '../../../constants';
import type { IFieldMeta, IRow } from '../../../interfaces';
import { getRange } from '../../../utils';
import { SelectedFlag } from './RExplainer';

interface ChartItemProps {
    data: IRow[];
    mainField: IFieldMeta;
    mainFieldAggregation: null | 'sum' | 'mean';
    handleSelect?: (predictor: ((value: string | number) => boolean) | null) => void;
    targetField: IFieldMeta | null;
}

const SELECT_SIGNAL_NAME = '__select__';

const ChartItem: React.FC<ChartItemProps> = ({ data, mainField, mainFieldAggregation, handleSelect, targetField }) => {
    const container = useRef<HTMLDivElement>(null);
    const viewRef = useRef<View>();
    const dataRef = useRef(data);
    dataRef.current = data;
    const handleSelectRef = useRef(handleSelect);
    handleSelectRef.current = handleSelect;

    const filterType = mainField.semanticType === 'quantitative' || mainField.semanticType === 'temporal' ? 'interval' : 'point';

    useEffect(() => {
        const signalChange$ = new Subject<Parameters<NonNullable<typeof handleSelect>>[0]>();
        const updateSelect = signalChange$.pipe(throttleTime(100)).subscribe(predictor => {
            handleSelectRef.current?.(predictor);
        });
        if (container.current) {
            const commonEncodings = {
                mark: {
                    type: 'bar',
                    tooltip: true,
                },
                encoding: targetField ? {
                    x: {
                        field: targetField.fid,
                        bin: targetField.semanticType === 'quantitative' || targetField.semanticType === 'temporal',
                    },
                    y: {
                        aggregate: 'count' as const,
                    },
                } : {
                    x: {
                        field: mainField.fid,
                        bin: mainField.semanticType === 'quantitative' || mainField.semanticType === 'temporal',
                    },
                    y: {
                        aggregate: 'count' as const,
                    },
                },
                // encoding: targetField ? {
                //     x: {
                //         field: targetField.fid,
                //         // bin: targetField.semanticType === 'quantitative' || targetField.semanticType === 'temporal',
                //     },
                //     y: {
                //         field: mainField.fid,
                //         // bin: mainField.semanticType === 'quantitative' || mainField.semanticType === 'temporal',
                //         aggregate: mainFieldAggregation ?? undefined,
                //     },
                // } : {
                //     x: {
                //         field: mainField.fid,
                //         bin: mainField.semanticType === 'quantitative' || mainField.semanticType === 'temporal',
                //     },
                //     y: {
                //         aggregate: 'count' as const,
                //     },
                // },
            } as const;
            embed(container.current, {
                width: 200,
                height: 200,
                autosize: {
                    type: 'fit',
                    contains: 'padding',
                },
                title: targetField ? `${targetField.name || targetField.fid} - ${mainField.name || mainField.fid}` : (
                    mainField.name || mainField.fid
                ),
                data: {
                    // @ts-ignore
                    name: 'dataSource',
                    values: dataRef.current,
                },
                layer: [
                    {
                        params: targetField ? [] : [
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
                        transform: targetField ? [
                            { filter: `datum.${SelectedFlag} == 1` }
                        ] : [
                            { filter: { param: SELECT_SIGNAL_NAME } },
                        ],
                        ...commonEncodings,
                    },
                ],
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
                if (!targetField) {
                    const handler = () => {
                        const state = res.view.getState().data[`${SELECT_SIGNAL_NAME}_store`][0];
                        if (state) {
                            switch (filterType) {
                                case 'interval': {
                                    const range = getRange(state.values[0]);
                                    signalChange$.next(val => {
                                        const d = Number(val);
                                        return d >= range[0] && d <= range[1];
                                    });
                                    break;
                                }
                                case 'point': {
                                    const set = state.values as (string | number)[];
                                    signalChange$.next(val => set.includes(val));
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
    }, [mainField, mainFieldAggregation, filterType, targetField, data]);

    return <div ref={container} />;
};

export default observer(ChartItem);
