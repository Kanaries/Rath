import { useMemo, useRef } from "react";
import { ActionButton, Dropdown, Stack } from "@fluentui/react";
import { observer } from "mobx-react-lite";
import produce from "immer";
import type { IFieldMeta, IFilter } from "@kanaries/loa";
import { nanoid } from "nanoid";
import styled from "styled-components";
import { CategoricalMetricAggregationTypes, CompareTarget, FilterRule, IUniqueFilter, MetricAggregationType, NumericalMetricAggregationTypes, useBreakoutStore } from "../store";
import { coerceNumber } from "../utils/format";
import ConfigButton, { IConfigButtonRef } from "./configButton";
import MetricFilter, { flatFilterRules, mergeFilterRules } from "./metricFilter";


const StackTokens = {
    childrenGap: 10,
};

const TargetSelector = styled.div`
    margin: 1rem;
    max-height: 30rem;
    overflow-y: auto;

    .ms-Dropdown-container {
        margin-block: 1rem;
        padding-inline: 1rem;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        > label {
            flex-grow: 1;
            flex-shrink: 0;
            margin-right: 1rem;
        }
        > div {
            flex-grow: 0;
            flex-shrink: 0;
            width: 10rem;
            opacity: 0;
        }
        :hover > div {
            opacity: 1;
        }
    }
`;

export const resolveCompareTarget = (target: CompareTarget, fields: IFieldMeta[]): { field: IFieldMeta; aggregate: MetricAggregationType; key: string; text: string } | null => {
    const field = fields.find(f => f.fid === target.fid);
    if (field) {
        return {
            field,
            aggregate: target.aggregate,
            key: `${field.name || field.fid}@${target.aggregate}`,
            text: `${target.aggregate} of "${field.name || field.fid}"`,
        };
    }
    return null;
};

export enum PeriodFlag {
    Weekday = 'Week',
    Day = 'Day',
    Month = 'Month',
    Season = 'Season',
    Year = 'Year',
}

const mayBePeriod = (field: IFieldMeta): PeriodFlag | null => {
    if (field.semanticType === 'nominal') {
        if (field.distribution.length <= 7 && field.name?.match(/week/i)) {
            return PeriodFlag.Weekday;
        }
    } else if (field.semanticType === 'ordinal' || field.semanticType === 'temporal') {
        if (field.distribution.length <= 7 && field.name?.match(/week/i)) {
            return PeriodFlag.Weekday;
        }
        if (field.distribution.length <= 31 && field.name?.match(/day/i)) {
            return PeriodFlag.Day;
        }
        if (field.distribution.length <= 12 && field.name?.match(/month/i)) {
            return PeriodFlag.Month;
        }
        if (field.distribution.length <= 4 && field.name?.match(/season/i)) {
            return PeriodFlag.Season;
        }
        if (field.name?.match(/year/i)) {
            return PeriodFlag.Year;
        }
    }
    return null;
};

const ControlPanel = observer(function ControlPanel () {
    const context = useBreakoutStore();
    const { dataSourceStore, compareTarget, compareBase } = context;
    const { fieldMetas } = dataSourceStore;

    const compareTargetItem = compareTarget ? resolveCompareTarget(compareTarget, fieldMetas) : undefined;
    const targetSelectorRef = useRef<IConfigButtonRef>(null);
    const onSelectTarget = (field: IFieldMeta, aggregate: MetricAggregationType) => {
        context.setCompareTarget({
            fid: field.fid,
            aggregate,
            metric: null,
        });
    };

    const validMeasures = fieldMetas.filter(f => f.analyticType === 'measure' && f.semanticType !== 'temporal');

    const [targetSelectorPeriods, otherFilters] = useMemo<[{ flag: PeriodFlag; filter: IFilter }[], IUniqueFilter[]]>(() => {
        if (!compareTarget?.metric) {
            return [[], []];
        }
        const filters = flatFilterRules(compareTarget.metric);
        const temporalFilters: { flag: PeriodFlag; filter: IUniqueFilter }[] = [];
        for (const f of filters) {
            const field = fieldMetas.find(which => which.fid === f.fid);
            if (!field) {
                continue;
            }
            const flag = mayBePeriod(field);
            if (flag) {
                temporalFilters.push({ flag, filter: f });
            }
        }
        const otherFilters = filters.filter(f => !temporalFilters.some(t => t.filter.id === f.id));
        return [temporalFilters, otherFilters];
    }, [compareTarget, fieldMetas]);

    const suggestions = useMemo<{ title: string; rule: FilterRule }[]>(() => {
        if (targetSelectorPeriods.length === 0) {
            return [];
        }

        const list: { title: string; rule: FilterRule }[] = [];
        
        const minFlag = [
            PeriodFlag.Weekday,
            PeriodFlag.Day,
            PeriodFlag.Month,
            PeriodFlag.Season,
            PeriodFlag.Year,
        ].find(flag => targetSelectorPeriods.some(f => f.flag === flag));

        const minPeriodFilters = targetSelectorPeriods.filter(f => f.flag === minFlag);

        if (!minFlag || minPeriodFilters.length !== 1) {
            return [];
        }

        const minPeriodFilter = minPeriodFilters[0].filter;
        const prevLevels = {
            [PeriodFlag.Weekday]: [],
            [PeriodFlag.Day]: [PeriodFlag.Weekday, PeriodFlag.Month],
            [PeriodFlag.Month]: [PeriodFlag.Season, PeriodFlag.Year],
            [PeriodFlag.Season]: [PeriodFlag.Year],
            [PeriodFlag.Year]: [],
        }[minFlag] as PeriodFlag[];

        if (minPeriodFilter.type !== 'set') {
            return [];
        }

        const currentValue = coerceNumber((minPeriodFilter.values as [number | string])[0]);
        let prevPeriod: typeof targetSelectorPeriods[number] | null = null;
        for (const flag of prevLevels) {
            const filters = targetSelectorPeriods.filter(f => f.flag === flag);
            if (filters.length === 1 && filters[0].filter.type === 'set') {
                prevPeriod = filters[0];
                break;
            }
        }

        const prevValue = ((): number | null => {
            if (!prevPeriod || prevPeriod.filter.type !== 'set') {
                return null;
            }
            const cur = coerceNumber((prevPeriod.filter.values as [number | string])[0]);
            switch (prevPeriod.flag) {
                case PeriodFlag.Season: {
                    return (cur + 3) % 4;
                }
                case PeriodFlag.Year: {
                    return cur - 1;
                }
                default: {
                    return null;
                }
            }
        })();

        const withOthers = (rule: FilterRule) => {
            const others = mergeFilterRules(otherFilters);
            if (others) {
                return produce(others, draft => {
                    let cursor = draft;
                    while ('and' in cursor && cursor.and) {
                        cursor = cursor.and;
                    }
                    // @ts-expect-error
                    cursor.and = rule;
                });
            } else {
                return rule;
            }
        };

        if (prevPeriod && prevValue !== null) {
            switch (minFlag) {
                case PeriodFlag.Month: {
                    list.push({
                        title: `Same Month Last ${prevPeriod.flag}`,
                        rule: withOthers({
                            when: {
                                type: 'set',
                                id: nanoid(),
                                fid: minPeriodFilter.fid,
                                values: [currentValue],
                            },
                            and: {
                                when: {
                                    id: nanoid(),
                                    type: 'set',
                                    fid: prevPeriod.filter.fid,
                                    values: [prevValue],
                                },
                            },
                        }),
                    });
                    break;
                }
                case PeriodFlag.Season: {
                    list.push({
                        title: `Same Season Last ${prevPeriod.flag}`,
                        rule: withOthers({
                            when: {
                                type: 'set',
                                id: nanoid(),
                                fid: minPeriodFilter.fid,
                                values: [currentValue - 1],
                            },
                            and: {
                                when: {
                                    id: nanoid(),
                                    type: 'set',
                                    fid: prevPeriod.filter.fid,
                                    values: [prevValue],
                                },
                            },
                        }),
                    });
                    break;
                }
                default: {
                    break;
                }
            }
        }

        switch (minFlag) {
            case PeriodFlag.Weekday: {
                list.push({
                    title: 'Last Week',
                    rule: withOthers({
                        when: {
                            type: 'set',
                            id: nanoid(),
                            fid: minPeriodFilter.fid,
                            values: [(currentValue + 6) % 7],
                        },
                        and: prevPeriod ? {
                            when: {
                                ...prevPeriod.filter,
                                id: nanoid(),
                            },
                        } : undefined,
                    }),
                });
                break;
            }
            case PeriodFlag.Month: {
                list.push({
                    title: 'Last Month',
                    rule: withOthers({
                        when: {
                            type: 'set',
                            id: nanoid(),
                            fid: minPeriodFilter.fid,
                            values: [(currentValue + 11) % 12],
                        },
                        and: prevPeriod ? {
                            when: {
                                ...prevPeriod.filter,
                                id: nanoid(),
                            },
                        } : undefined,
                    }),
                });
                break;
            }
            case PeriodFlag.Year: {
                list.push({
                    title: 'Last Year',
                    rule: withOthers({
                        when: {
                            type: 'set',
                            id: nanoid(),
                            fid: minPeriodFilter.fid,
                            values: [currentValue - 1],
                        },
                        and: prevPeriod ? {
                            when: {
                                ...prevPeriod.filter,
                                id: nanoid(),
                            },
                        } : undefined,
                    }),
                });
                break;
            }
            default: {
                break;
            }
        }

        return list;
    }, [targetSelectorPeriods, otherFilters]);

    return (
        <Stack horizontal tokens={StackTokens}>
            <Stack horizontal>
                <ConfigButton button={{ text: compareTargetItem?.text ?? 'Select a target' }} ref={targetSelectorRef}>
                    <TargetSelector>
                        {validMeasures.length === 0 && (
                            <p>
                                No valid measure field found.
                            </p>
                        )}
                        {validMeasures.map(f => {
                            const options = (f.semanticType === 'nominal' || f.semanticType === 'ordinal' ? CategoricalMetricAggregationTypes : NumericalMetricAggregationTypes).map(aggregate => {
                                const item: CompareTarget = { fid: f.fid, aggregate, metric: null };
                                const target = resolveCompareTarget(item, fieldMetas)!;
                                return {
                                    key: target.key,
                                    text: aggregate,
                                    data: item,
                                };
                            });
                            return (
                                <Dropdown
                                    key={f.fid}
                                    options={options}
                                    label={f.name || f.fid}
                                    selectedKey={compareTargetItem?.key}
                                    onChange={(_, opt) => {
                                        const item = opt?.data as (typeof options)[number]['data'] | undefined;
                                        if (item) {
                                            onSelectTarget(f, item.aggregate);
                                            targetSelectorRef.current?.dismiss();
                                        }
                                    }}
                                />
                            );
                        })}
                    </TargetSelector>
                </ConfigButton>
                <ConfigButton button={{ iconProps: { iconName: 'Filter' }, disabled: !compareTarget, styles: { root: { padding: '0', minWidth: '32px', borderLeft: 'none' } } }}>
                    {compareTarget && (
                        <MetricFilter
                            fields={fieldMetas}
                            value={compareTarget.metric}
                            onChange={metric => {
                                context.setCompareTarget(produce(compareTarget, target => {
                                    target.metric = metric;
                                }));
                            }}
                        />
                    )}
                </ConfigButton>
            </Stack>
            {Boolean(compareTarget?.metric) && (
                <ConfigButton button={{ text: 'Compare' }}>
                    {suggestions.length > 0 && (
                        <Stack>
                            {suggestions.map((sug, i) => (
                                <ActionButton
                                    key={i}
                                    text={sug.title}
                                    onClick={() => {
                                        context.setCompareBase(sug.rule);
                                    }}
                                />
                            ))}
                        </Stack>
                    )}
                    <MetricFilter
                        fields={fieldMetas}
                        value={compareBase}
                        onChange={metric => {
                            context.setCompareBase(metric);
                        }}
                    />
                </ConfigButton>
            )}
        </Stack>
    );
});


export default ControlPanel;
