import { useMemo, useRef } from "react";
import { ActionButton, Dropdown, Stack } from "@fluentui/react";
import { observer } from "mobx-react-lite";
import type { IFieldMeta, IFilter } from "@kanaries/loa";
import styled from "styled-components";
import { CategoricalMetricAggregationTypes, BreakoutMainField, IUniqueFilter, NumericalMetricAggregationTypes, useBreakoutStore } from "../store";
import { coerceNumber } from "../utils/format";
import type { Aggregator } from "../../../global";
import ConfigButton, { IConfigButtonRef } from "./configButton";
import MetricFilter, { flatFilterRules } from "./metricFilter";


const TargetSelector = styled.div`
    margin: 1rem 0;

    .ms-Dropdown-container {
        margin-block: 1rem;
        padding-inline: 0.2rem;
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

export const resolveCompareTarget = (target: BreakoutMainField, fields: IFieldMeta[]): { field: IFieldMeta; aggregate: Aggregator; key: string; text: string } | null => {
    const field = fields.find(f => f.fid === target.fid);
    if (field) {
        return {
            field,
            aggregate: target.aggregator,
            key: `${field.name || field.fid}@${target.aggregator}`,
            text: `${target.aggregator} of "${field.name || field.fid}"`,
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

export const MainFieldSelector = observer(function MainFieldSelector () {
    const context = useBreakoutStore();
    const { fields, mainField } = context;

    const compareTargetItem = mainField ? resolveCompareTarget(mainField, fields) : undefined;
    const targetSelectorRef = useRef<IConfigButtonRef>(null);
    const onSelectTarget = (field: IFieldMeta, aggregator: Aggregator) => {
        context.setMainField({
            fid: field.fid,
            aggregator,
        });
    };

    const validMeasures = fields.filter(f => f.analyticType === 'measure' && f.semanticType !== 'temporal');

    return (
        <TargetSelector>
            {validMeasures.length === 0 && (
                <p>
                    No valid measure field found.
                </p>
            )}
            {validMeasures.map(f => {
                const options = (f.semanticType === 'nominal' || f.semanticType === 'ordinal' ? CategoricalMetricAggregationTypes : NumericalMetricAggregationTypes).map(aggregator => {
                    const item: BreakoutMainField = { fid: f.fid, aggregator };
                    const target = resolveCompareTarget(item, fields)!;
                    return {
                        key: target.key,
                        text: aggregator,
                        data: item,
                    };
                });
                if (options.length === 0) {
                    return null;
                }
                return (
                    <Dropdown
                        key={f.fid}
                        options={options}
                        label={f.name || f.fid}
                        selectedKey={compareTargetItem?.key}
                        onChange={(_, opt) => {
                            const item = opt?.data as (typeof options)[number]['data'] | undefined;
                            if (item) {
                                onSelectTarget(f, item.aggregator);
                                targetSelectorRef.current?.dismiss();
                            }
                        }}
                    />
                );
            })}
        </TargetSelector>
    );
});

export const CompareGroupSelector = observer(function CompareGroupSelector () {
    const context = useBreakoutStore();
    const { fields, mainFieldFilters, comparisonFilters } = context;
    
    const [targetSelectorPeriods, otherFilters] = useMemo<[{ flag: PeriodFlag; filter: IFilter }[], IUniqueFilter[]]>(() => {
        if (mainFieldFilters.length === 0) {
            return [[], []];
        }
        const filters = flatFilterRules(mainFieldFilters);
        const temporalFilters: { flag: PeriodFlag; filter: IUniqueFilter }[] = [];
        for (const f of filters) {
            const field = fields.find(which => which.fid === f.fid);
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
    }, [mainFieldFilters, fields]);

    const suggestions = useMemo<{ title: string; rule: IFilter[] }[]>(() => {
        if (targetSelectorPeriods.length === 0) {
            return [];
        }

        const list: { title: string; rule: IFilter[] }[] = [];
        
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

        const withOthers = (rule: (IFilter | undefined)[]) => {
            return [...otherFilters, ...rule.filter(Boolean)] as IFilter[];
        };

        if (prevPeriod && prevValue !== null) {
            switch (minFlag) {
                case PeriodFlag.Month: {
                    list.push({
                        title: `Same Month Last ${prevPeriod.flag}`,
                        rule: withOthers([
                            {
                                type: 'set',
                                fid: minPeriodFilter.fid,
                                values: [currentValue],
                            },
                            {
                                type: 'set',
                                fid: prevPeriod.filter.fid,
                                values: [prevValue],
                            },
                        ]),
                    });
                    break;
                }
                case PeriodFlag.Season: {
                    list.push({
                        title: `Same Season Last ${prevPeriod.flag}`,
                        rule: withOthers([
                            {
                                type: 'set',
                                fid: minPeriodFilter.fid,
                                values: [currentValue - 1],
                            },
                            {
                                type: 'set',
                                fid: prevPeriod.filter.fid,
                                values: [prevValue],
                            },
                        ]),
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
                    rule: withOthers([
                        {
                            type: 'set',
                            fid: minPeriodFilter.fid,
                            values: [(currentValue + 6) % 7],
                        },
                        prevPeriod?.filter,
                    ]),
                });
                break;
            }
            case PeriodFlag.Month: {
                list.push({
                    title: 'Last Month',
                    rule: withOthers([
                        {
                            type: 'set',
                            fid: minPeriodFilter.fid,
                            values: [(currentValue + 11) % 12],
                        },
                        prevPeriod?.filter,
                    ]),
                });
                break;
            }
            case PeriodFlag.Year: {
                list.push({
                    title: 'Last Year',
                    rule: withOthers([
                        {
                            type: 'set',
                            fid: minPeriodFilter.fid,
                            values: [currentValue - 1],
                        },
                        prevPeriod?.filter,
                    ]),
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
        <ConfigButton button={{ text: 'Compare' }}>
            {suggestions.length > 0 && (
                <Stack>
                    {suggestions.map((sug, i) => (
                        <ActionButton
                            key={i}
                            text={sug.title}
                            onClick={() => {
                                context.setComparisonFilters(sug.rule);
                            }}
                        />
                    ))}
                </Stack>
            )}
            <MetricFilter
                fields={fields}
                filters={comparisonFilters}
                onChange={metric => {
                    context.setComparisonFilters(metric);
                }}
            />
        </ConfigButton>
    );
});
