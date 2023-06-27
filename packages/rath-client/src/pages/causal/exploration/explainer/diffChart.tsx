import React, { useRef, useEffect, useMemo } from 'react';
import type { View } from 'vega';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import embed from 'vega-embed';
// import { EDITOR_URL } from '../../../../constants';
import type { IFieldMeta, IRow } from '../../../../interfaces';
import { getVegaTimeFormatRules } from '../../../../utils';


interface DiffChartProps {
    title?: string;
    data: readonly IRow[];
    subspaces: [number[], number[]];
    mainField: IFieldMeta;
    mainFieldAggregation: null | 'sum' | 'mean' | 'count';
    dimension: IFieldMeta;
    mode: 'full' | 'other' | 'two-group';
}

const DiffGroup1Key = '__diff_group_1__';
const DiffGroup2Key = '__diff_group_2__';

const DiffChart: React.FC<DiffChartProps> = ({ title, data, subspaces, mainField, mainFieldAggregation, dimension, mode }) => {
    const container = useRef<HTMLDivElement>(null);
    const viewRef = useRef<View>();

    const subspacesRef = useRef(subspaces);
    subspacesRef.current = subspaces;

    const source = useMemo(() => {
        return data.map((row, i) => ({
            ...row,
            [DiffGroup1Key]: subspacesRef.current[0].includes(i) ? 1 : 0,
            [DiffGroup2Key]: subspacesRef.current[1].includes(i) ? 1 : 0,
        }));
    }, [data]);

    const dataRef = useRef(source);
    dataRef.current = source;

    useEffect(() => {
        if (container.current) {
            const translatedKey = '__target__';
            const commonEncodings = {
                mark: {
                    type: mainFieldAggregation ? dimension.semanticType === 'temporal' ? 'area' : 'bar' : 'point',
                    tooltip: true,
                    size: 10,
                },
                encoding: {
                    x: {
                        field: dimension.fid,
                        title: `${dimension.name || dimension.fid}`,
                        type: dimension.semanticType,
                        bin: mainFieldAggregation && dimension.semanticType === 'quantitative',
                    },
                },
            } as const;
            embed(container.current, {
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
                layer: dimension.semanticType === 'quantitative' ? [
                    {
                        transform: [
                            { filter: `datum.${DiffGroup2Key} == 1` },
                        ],
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
                            { filter: `datum.${DiffGroup1Key} == 1` },
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
                ] : mainFieldAggregation ? [
                    {
                        transform: [
                            { filter: `datum.${DiffGroup2Key} == 1` },
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
                            { filter: `datum.${DiffGroup1Key} == 1` },
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
                ] : [
                    {
                        transform: [
                            { filter: `datum.${DiffGroup2Key} == 1` },
                        ],
                        mark: commonEncodings.mark,
                        encoding: {
                            x: commonEncodings.encoding.x,
                            y: {
                                field: mainField.fid,
                                title: mainField.name || mainField.fid,
                                type: mainField.semanticType,
                            },
                            color: { value: 'gray' },
                        },
                    },
                    {
                        transform: [
                            { filter: `datum.${DiffGroup1Key} == 1` },
                        ],
                        mark: {
                            ...commonEncodings.mark,
                            size: 5,
                        },
                        encoding: {
                            x: commonEncodings.encoding.x,
                            y: {
                                field: mainField.fid,
                                title: `subset:${mainField.name || mainField.fid}`,
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
                // editorUrl: EDITOR_URL,
                timeFormatLocale: getVegaTimeFormatRules(intl.get('time_format.langKey')) as any,
                actions: false,
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
    }, [mainField, title, mainFieldAggregation, mode, dimension]);

    useEffect(() => {
        viewRef.current?.change(
            'dataSource',
            viewRef.current.changeset().remove(() => true).insert(source),
        );
    }, [source]);

    return <div ref={container} />;
};

export default observer(DiffChart);
