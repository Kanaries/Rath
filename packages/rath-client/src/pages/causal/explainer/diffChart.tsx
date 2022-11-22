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
    dimension: IFieldMeta;
    mode: 'full' | 'other' | 'two-group';
}

const DiffChart: React.FC<DiffChartProps> = ({ data, mainField, mainFieldAggregation, dimension, mode }) => {
    const container = useRef<HTMLDivElement>(null);
    const viewRef = useRef<View>();

    useEffect(() => {
        if (container.current) {
            const translatedKey = '__target__';
            const commonEncodings = {
                mark: {
                    type: dimension.semanticType === 'temporal' ? 'area' : 'bar',
                    tooltip: true,
                    size: 10,
                },
                encoding: {
                    x: {
                        field: dimension.fid,
                        title: `${dimension.name || dimension.fid}`,
                        type: dimension.semanticType,
                        bin: dimension.semanticType === 'quantitative',
                    },
                },
            } as const;
            embed(container.current, {
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
                layer: dimension.semanticType === 'quantitative' ? [
                    {
                        mark: commonEncodings.mark,
                        encoding: {
                            x: commonEncodings.encoding.x,
                            y: {
                                field: mainField.fid,
                                aggregate: mainFieldAggregation ?? 'count',
                                title: `${mainFieldAggregation ?? 'count'}(${mainField.name || mainField.fid})`,
                                type: mainField.semanticType,
                            },
                            color: { value: 'gray' },
                        },
                    },
                    {
                        transform: [
                            { filter: `datum.${SelectedFlag} != 0` },
                        ],
                        mark: {
                            ...commonEncodings.mark,
                            size: 5,
                        },
                        encoding: {
                            x: commonEncodings.encoding.x,
                            y: {
                                field: mainField.fid,
                                aggregate: mainFieldAggregation ?? 'count',
                                title: `subset:${mainFieldAggregation ?? 'count'}(${mainField.name || mainField.fid})`,
                                type: mainField.semanticType,
                            },
                            color: { value: 'orange' },
                        },
                    },
                ] : [
                    {
                        transform: [
                            {
                                aggregate: [{
                                    field: mainField.fid,
                                    op: mainFieldAggregation ?? 'count',
                                    as: translatedKey,
                                }],
                                groupby: [dimension.fid],
                            },
                        ],
                        mark: commonEncodings.mark,
                        encoding: {
                            x: commonEncodings.encoding.x,
                            y: {
                                field: translatedKey,
                                title: `${mainFieldAggregation ?? 'count'}(${mainField.name || mainField.fid})`,
                                type: mainField.semanticType,
                            },
                            color: { value: 'gray' },
                        },
                    },
                    {
                        transform: [
                            { filter: `datum.${SelectedFlag} != 0` },
                            {
                                aggregate: [{
                                    field: mainField.fid,
                                    op: mainFieldAggregation ?? 'count',
                                    as: translatedKey,
                                }],
                                groupby: [dimension.fid],
                            },
                        ],
                        mark: {
                            ...commonEncodings.mark,
                            size: 5,
                        },
                        encoding: {
                            x: commonEncodings.encoding.x,
                            y: {
                                field: translatedKey,
                                title: `subset:${mainFieldAggregation ?? 'count'}(${mainField.name || mainField.fid})`,
                                type: mainField.semanticType,
                            },
                            color: { value: 'orange' },
                        },
                    },
                ],
                config: {
                    axis: {
                        labelLimit: 30,
                    },
                },
                resolve: { scale: { y: 'independent' } },
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
    }, [mainField, mainFieldAggregation, data, mode, dimension]);

    return <div ref={container} />;
};

export default observer(DiffChart);
