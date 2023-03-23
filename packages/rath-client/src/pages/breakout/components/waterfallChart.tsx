import type { IRow } from "@kanaries/loa";
import intl from 'react-intl-universal';
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import styled from "styled-components";
import ReactVega from "../../../components/react-vega";
import ErrorBoundary from "../../../components/visErrorBoundary";
import { useGlobalStore } from "../../../store";
import { useBreakoutStore } from "../store";


const Container = styled.div`
    flex-grow: 1;
    flex-shrink: 1;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const WaterfallChart = observer(function WaterfallChart() {
    const { commonStore } = useGlobalStore();
    const { themeConfig } = commonStore;
    const { comparisonAnalyses, diffStats, mainField, focusedSubgroupFid, selectionStats } = useBreakoutStore();

    const firstClassSubgroups = useMemo<Pick<typeof comparisonAnalyses[number], 'id' | 'impact'>[]>(() => {
        if (!mainField || !selectionStats || !diffStats) {
            return [];
        }
        const topDivers: Pick<typeof comparisonAnalyses[number], 'id' | 'impact'>[] = comparisonAnalyses.filter(subgroup => {
            return subgroup.field.fid === focusedSubgroupFid && !subgroup.path?.length;
        });
        const prevValue = diffStats.stats[mainField.aggregator];
        const curValue = selectionStats.stats[mainField.aggregator];
        const topDiversSum = topDivers.reduce((sum, subgroup) => sum + subgroup.impact, 0);
        const others = (curValue - prevValue) - topDiversSum;
        if (Math.abs(others) >= 1e-6) {
            topDivers.push({
                "id": "Others",
                "impact": others,
            });
        }
        return topDivers;
    }, [comparisonAnalyses, focusedSubgroupFid, selectionStats, diffStats, mainField]);

    const LabelBase = intl.get('breakout.base');
    const LabelCur = intl.get('breakout.selection');

    const data = useMemo<IRow[]>(() => {
        if (!mainField || !diffStats) {
            return [];
        }
        return [
            { "label": LabelBase, "amount": diffStats.stats[mainField.aggregator] },
            ...firstClassSubgroups.map(subgroup => ({
                "label": subgroup.id,
                "amount": subgroup.impact,
            })),
            { "label": LabelCur, "amount": 0 }
        ].map((item, i) => ({
            ...item,
            index: i,
        }));
    }, [diffStats, mainField, firstClassSubgroups, LabelBase, LabelCur]);

    const spec = useMemo(() => {
        return {
            "width": 500,
            "height": 300,
            data: {
              name: 'dataSource',
            },
            "transform": [
                { "window": [{ "op": "sum", "field": "amount", "as": "sum" }] },
                { "window": [{ "op": "lead", "field": "label", "as": "lead" }] },
                {
                    "calculate": "datum.lead === null ? datum.label : datum.lead",
                    "as": "lead"
                },
                {
                    "calculate": `datum.label === '${LabelCur}' ? 0 : datum.sum - datum.amount`,
                    "as": "previous_sum"
                },
                {
                    "calculate": `datum.label === '${LabelCur}' ? datum.sum : datum.amount`,
                    "as": "amount"
                },
                {
                    "calculate": `(datum.label !== '${LabelBase}' && datum.label !== '${LabelCur}' && datum.amount > 0 ? '+' : '') + datum.amount`,
                    "as": "text_amount"
                },
                { "calculate": "(datum.sum + datum.previous_sum) / 2", "as": "center" },
                {
                    "calculate": "datum.sum < datum.previous_sum ? datum.sum : ''",
                    "as": "sum_dec"
                },
                {
                    "calculate": "datum.sum > datum.previous_sum ? datum.sum : ''",
                    "as": "sum_inc"
                }
            ],
            "encoding": {
                "x": {
                    "field": "label",
                    "type": "ordinal",
                    "sort": { "field": "index" },
                    "axis": { "labelAngle": 0, "title": intl.get("breakout.subgroups") }
                }
            },
            "layer": [
                {
                    "mark": { "type": "bar" },
                    "encoding": {
                        "y": {
                            "field": "previous_sum",
                            "type": "quantitative",
                            "title": intl.get("breakout.value")
                        },
                        "y2": { "field": "sum" },
                        "color": {
                            "condition": [
                                {
                                    "test": `datum.label === '${LabelBase}' || datum.label === '${LabelCur}'`,
                                    "value": "#f7e0b6"
                                },
                                { "test": "datum.sum < datum.previous_sum", "value": "#f78a64" }
                            ],
                            "value": "#93c4aa"
                        }
                    }
                },
                {
                    "mark": {
                        "type": "rule",
                        "color": "#404040",
                        "opacity": 1,
                        "strokeWidth": 2,
                        "xOffset": -22.5,
                        "x2Offset": 22.5
                    },
                    "encoding": {
                        "x2": { "field": "lead" },
                        "y": { "field": "sum", "type": "quantitative" }
                    }
                },
                {
                    "mark": { "type": "text", "dy": -4, "baseline": "bottom" },
                    "encoding": {
                        "y": { "field": "sum_inc", "type": "quantitative" },
                        "text": { "field": "sum_inc", "type": "nominal", "format": ".2f" }
                    }
                },
                {
                    "mark": { "type": "text", "dy": 4, "baseline": "top" },
                    "encoding": {
                        "y": { "field": "sum_dec", "type": "quantitative" },
                        "text": { "field": "sum_dec", "type": "nominal" }
                    }
                },
                {
                    "mark": { "type": "text", "fontWeight": "bold", "baseline": "middle" },
                    "encoding": {
                        "y": { "field": "center", "type": "quantitative" },
                        "text": { "field": "text_amount", "type": "nominal", "format": ".2f" },
                        "color": {
                            "condition": [
                                {
                                    "test": `datum.label === '${LabelBase}' || datum.label === '${LabelCur}'`,
                                    "value": "#725a30"
                                }
                            ],
                            "value": "white"
                        }
                    }
                }
            ],
            "config": { "text": { "fontWeight": "bold", "color": "#404040" } }
        };
    }, [LabelBase, LabelCur]);

    return (
        <Container>
            <ErrorBoundary>
                <ReactVega
                    dataSource={data}
                    spec={spec}
                    actions={false}
                    config={themeConfig}
                />
            </ErrorBoundary>
        </Container>
    );
});


export default WaterfallChart;
