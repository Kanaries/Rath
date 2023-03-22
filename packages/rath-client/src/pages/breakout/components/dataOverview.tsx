import { Stack } from "@fluentui/react";
import { observer } from "mobx-react-lite";
import styled from "styled-components";
import { CategoricalMetricAggregationTypes, MetricAggregationType, NumericalMetricAggregationTypes, useBreakoutStore } from "../store";
import { formatNumber, formatRate } from "../utils/format";
import { type FieldStats } from "../utils/stats";
import { resolveCompareTarget } from "./controlPanel";


const OverviewCardContainer = styled.div`
    border: 1px solid #8882;
    border-radius: 1rem;
    padding: 1rem;

    header {
        font-size: 1rem;
        font-weight: 600;
    }

    .main {
        padding-block: 1rem;
        border-bottom: 1px solid #8882;
        dt {
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
`;

const StackTokens = { childrenGap: 20 };

const OverviewCard = observer(function OverviewCard ({ stats, compareBase, title }: { stats: FieldStats; compareBase?: FieldStats; title: string }) {
    const { field, definition, stats: features } = stats;

    const isNumerical = field.semanticType === 'quantitative';

    let list: { key: MetricAggregationType; data: string }[] = isNumerical ? NumericalMetricAggregationTypes.map(key => {
        const value = features[key];
        return {
            key: key,
            data: key === MetricAggregationType.NumericalRate ? formatRate(value, 1) : formatNumber(value),
        };
    }) : CategoricalMetricAggregationTypes.map(key => {
        const value = features[key];
        return {
            key: key,
            data: key === MetricAggregationType.C_Rate ? formatRate(value, 1) : formatNumber(value),
        };
    });

    // TODO: hide some unimplemented items
    list = list.filter(item => item.data !== '-');

    const main = list.find(({ key }) => key === definition.aggregate);

    const diff = compareBase ? (
        (features[definition.aggregate] - compareBase.stats[definition.aggregate]) / compareBase.stats[definition.aggregate]
    ) : null;

    return (
        <OverviewCardContainer>
            <header>
                {title}
            </header>
            <dl className="main">
                <dt>{definition.aggregate}</dt>
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
            </dl>
            <div className="features">
                {list.map(({ key, data }) => (
                    <dl key={key}>
                        <dt>{key}</dt>
                        <dd>{data}</dd>
                    </dl>
                ))}
            </div>
        </OverviewCardContainer>
    );
});

const DataOverview = observer(function DataOverview () {
    const context = useBreakoutStore();
    const { dataSourceStore, compareTarget, compareBase, globalStats: targetGlobalStats, diffStats, selectionStats: targetSelectionStats } = context;
    const { fieldMetas } = dataSourceStore;
    const targetField = compareTarget ? resolveCompareTarget(compareTarget, fieldMetas) : null;

    const compareStats = compareBase ? diffStats : targetGlobalStats;

    const showGlobalStats = targetGlobalStats?.definition.metric === null;
    const showSelectionStats = compareStats && Boolean(targetSelectionStats);

    return (
        <Stack horizontal tokens={StackTokens} verticalAlign="center">
            {showGlobalStats && (
                <OverviewCard stats={targetGlobalStats} title={targetField!.text} />
            )}
            {showSelectionStats && (
                <>
                    <OverviewCard stats={compareStats} title={targetField!.text} />
                    <span>vs</span>
                    <OverviewCard stats={targetSelectionStats!} compareBase={compareStats} title={"Selection"} />
                </>
            )}
        </Stack>
    );
});


export default DataOverview;
