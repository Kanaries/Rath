import { IconButton, Stack } from "@fluentui/react";
import intl from 'react-intl-universal';
import type { IFieldMeta, IFilter } from "@kanaries/loa";
import { observer } from "mobx-react-lite";
import { ReactNode, useMemo } from "react";
import styled from "styled-components";
import { Aggregator } from "../../../global";
import { CategoricalMetricAggregationTypes, NumericalMetricAggregationTypes, useBreakoutStore } from "../store";
import { formatFilterRule, formatNumber, formatRate } from "../utils/format";
import { type FieldStats } from "../utils/stats";
import ConfigButton from "./configButton";
import { CompareGroupSelector, MainFieldSelector, resolveCompareTarget } from "./controlPanel";
import MetricFilter from "./metricFilter";
import WaterfallChart from "./waterfallChart";


const OverviewCardContainer = styled.div`
    border: 1px solid #8882;
    border-radius: 1rem;
    padding: 1rem;
    align-self: stretch;
    max-height: 360px;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    header {
        display: flex;
        flex-direction: row;
        align-items: center;
        > span {
            flex-grow: 1;
            flex-shrink: 1;
            margin-right: 1rem;
            font-size: 1.25rem;
            font-weight: 600;
        }
    }

    .filters {
        display: flex;
        flex-direction: column;
        :not(:empty) {
            margin-block: 0.4em;
        }
        small {
            font-size: 0.6rem;
            opacity: 0.6;
        }
    }

    .features {
        margin-top: 1rem;
        font-size: 0.9rem;
        display: flex;
        flex-direction: column;
        dl {
            display: flex;
            flex-direction: row;
            align-items: baseline;
            justify-content: space-between;
            dt {
                flex-grow: 1;
                flex-shrink: 1;
                font-weight: 500;
                text-transform: capitalize;
            }
            dd {
                flex-grow: 0;
                flex-shrink: 0;
                width: 5em;
                margin-left: 1em;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                text-align: right;
            }
        }
    }

    .scroll-container {
        flex-grow: 1;
        flex-shrink: 1;
        overflow-y: auto;
        margin-block: 1rem;
    }
`;

const Info = styled.dl`
    padding-block: 1rem;
    border-bottom: 1px solid #8882;
    dt {
        /* sr-only */
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
    }
    dd {
        display: flex;
        flex-direction: row;
        align-items: center;
        .data {
            font-weight: 600;
            font-size: 1.5rem;
        }
        .diff {
            font-size: 0.8rem;
            margin-left: 1em;
            padding: 0.1em 0.4em;
            background-color: #8882;
            border-radius: 0.33em;
            &.up {
                color: green;
            }
            &.down {
                color: red;
            }
        }
    }
`;

const StackTokens = { childrenGap: 20 };
const StackStyle = { minHeight: '360px' };

interface IOverviewCardProps {
    /** @default [] */
    filters?: readonly IFilter[];
    stats: FieldStats;
    compareBase?: FieldStats;
    title: string;
    onRemove?: () => void;
    actions?: ReactNode;
}

const OverviewCard = observer<IOverviewCardProps>(function OverviewCard ({
    filters = [], stats, compareBase, title, onRemove, actions,
}) {
    const { field, definition, stats: features } = stats;
    const { fields } = useBreakoutStore();

    const isNumerical = field.semanticType === 'quantitative';

    let list: { key: Aggregator; data: string }[] = isNumerical ? NumericalMetricAggregationTypes.map(key => {
        const value = features[key];
        return {
            key: key,
            data: formatNumber(value),
        };
    }) : CategoricalMetricAggregationTypes.map(key => {
        const value = features[key];
        return {
            key: key,
            data: formatNumber(value),
        };
    });

    list = list.filter(item => item.data !== '-');

    const main = list.find(({ key }) => key === definition.aggregator);

    const curVal = features[definition.aggregator];
    const prevVal = compareBase ? compareBase.stats[definition.aggregator] : NaN;

    const diff = compareBase ? (
        (curVal - prevVal) / prevVal
    ) : null;

    const filtersWithField = useMemo(() => {
        return filters.reduce<{ filter: IFilter; field: IFieldMeta }[]>((list, filter) => {
            const field = fields.find(field => field.fid === filter.fid);
            if (field) {
                list.push({ filter, field });
            }
            return list;
        }, []);
    }, [filters, fields]);

    return (
        <OverviewCardContainer>
            <header>
                <span>
                    {title}
                </span>
                {actions}
                {onRemove && (
                    <IconButton
                        iconProps={{ iconName: 'Clear' }}
                        onClick={onRemove}
                    />
                )}
            </header>
            <div className="filters">
                {filtersWithField.map(({ field, filter }, i) => (
                    <small key={i}>
                        {formatFilterRule(filter, field)}
                    </small>
                ))}
            </div>
            <Info>
                <dt>{definition.aggregator}</dt>
                <dd>
                    <span className="data">
                        {main?.data || '-'}
                    </span>
                    {diff !== null && (
                        <span className={`diff ${diff === 0 ? '' : diff > 0 ? 'up' : 'down'}`}>
                            {diff === 0 && '-'}
                            {diff > 0 && `+${formatRate(diff, 2)}`}
                            {diff < 0 && formatRate(diff, 2)}
                        </span>
                    )}
                </dd>
            </Info>
            <div className="features">
                {list.map(({ key, data }) => (
                    <dl key={key}>
                        <dt>{intl.get(`common.stat.${key}`)}</dt>
                        <dd>{data}</dd>
                    </dl>
                ))}
            </div>
        </OverviewCardContainer>
    );
});

const DataOverview = observer(function DataOverview () {
    const context = useBreakoutStore();
    const { fields, mainField, mainFieldFilters, comparisonFilters, globalStats, diffStats, selectionStats } = context;
    const targetField = mainField ? resolveCompareTarget(mainField, fields) : null;

    const compareStats = comparisonFilters.length > 0 ? diffStats : globalStats;

    const showGlobalStats = globalStats && targetField && mainFieldFilters.length === 0;
    const showSelectionStats = targetField && compareStats && selectionStats && !showGlobalStats;

    return (
        <Stack horizontal tokens={StackTokens} verticalAlign="center" style={StackStyle}>
            {/* {!showGlobalStats && !showSelectionStats && (
                <OverviewCardContainer>
                    <header>
                        <span>Select A Target</span>
                    </header>
                    <div className="scroll-container">
                        <MainFieldSelector />
                    </div>
                </OverviewCardContainer>
            )} */}
            {showGlobalStats && (
                <>
                    <OverviewCard
                        stats={globalStats}
                        title={targetField.text}
                        onRemove={() => context.setMainField(null)}
                    />
                    {mainField && mainFieldFilters.length === 0 && (
                        <OverviewCardContainer>
                            <header>
                                <span>{intl.get('breakout.select_a_group')}</span>
                            </header>
                            <div className="scroll-container">
                                <MetricFilter
                                    fields={fields}
                                    filters={mainFieldFilters}
                                    onChange={metric => {
                                        context.setMainFieldFilters(metric);
                                    }}
                                />
                            </div>
                        </OverviewCardContainer>
                    )}
                </>
            )}
            {showSelectionStats && (
                <>
                    <OverviewCard
                        stats={compareStats}
                        filters={comparisonFilters}
                        title={`[${intl.get('breakout.base')}] ${targetField.text}`}
                        // onRemove={() => context.setComparisonFilters([])}
                        actions={<CompareGroupSelector />}
                    />
                    <span>{'\u2192'}</span>
                    <OverviewCard
                        stats={selectionStats}
                        filters={mainFieldFilters}
                        compareBase={compareStats}
                        title={`[${intl.get('breakout.selection')}] ${targetField.text}`}
                        // onRemove={() => context.setMainField(null)}
                        actions={<ConfigButton button={{ iconProps: { iconName: 'Settings' } }}><MainFieldSelector /></ConfigButton>}
                    />
                    {comparisonFilters.length > 0 && (
                        <WaterfallChart />
                    )}
                </>
            )}
        </Stack>
    );
});


export default DataOverview;
