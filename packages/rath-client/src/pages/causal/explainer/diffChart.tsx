import React, { useRef, useEffect } from 'react';
import type { View } from 'vega';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import embed from 'vega-embed';
import { EDITOR_URL } from '../../../constants';
import type { IFieldMeta, IRow } from '../../../interfaces';
import { SelectedFlag } from './RExplainer';


interface DiffChartProps {
    data: IRow[];
    mainField: IFieldMeta;
    mainFieldAggregation: null | 'sum' | 'mean' | 'count';
    mode: 'full' | 'other' | 'two-group';
}

const DiffChart: React.FC<DiffChartProps> = ({ data, mainField, mainFieldAggregation, mode }) => {
    const container = useRef<HTMLDivElement>(null);
    const viewRef = useRef<View>();

    useEffect(() => {
        if (container.current) {
            const commonEncodings = {
                mark: {
                    type: 'bar',
                    tooltip: true,
                },
                encoding: {
                    x: {
                        field: SelectedFlag,
                        type: 'ordinal',
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
                layer: [
                    {
                        mark: commonEncodings.mark,
                        encoding: {
                            ...commonEncodings.encoding,
                            color: { value: 'gray' },
                        },
                    },
                    {
                        transform: [
                            { filter: `datum.${SelectedFlag} != 0` },
                        ],
                        mark: commonEncodings.mark,
                        encoding: {
                            ...commonEncodings.encoding,
                            color: {
                                field: SelectedFlag,
                                type: 'nominal',
                                legend: null,
                            },
                        },
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
            });
        }
        return () => {
            if (viewRef.current) {
                viewRef.current.finalize();
                viewRef.current = undefined;
            }
        };
    }, [mainField, mainFieldAggregation, data, mode]);

    return <div ref={container} />;
};

export default observer(DiffChart);
