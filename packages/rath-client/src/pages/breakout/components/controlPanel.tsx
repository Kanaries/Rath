import intl from 'react-intl-universal';
import { useRef } from "react";
import { Dropdown } from "@fluentui/react";
import { observer } from "mobx-react-lite";
import type { IFieldMeta } from "@kanaries/loa";
import styled from "styled-components";
import { CategoricalMetricAggregationTypes, BreakoutMainField, NumericalMetricAggregationTypes, useBreakoutStore } from "../store";
import type { Aggregator } from "../../../global";
import ConfigButton, { IConfigButtonRef } from "./configButton";
import MetricFilter from "./metricFilter";


const TargetSelector = styled.div`
    margin: 1rem 0;
    padding: 1rem;

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
        :hover > div, &.current > div {
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
            text: `${intl.get(`common.stat.${target.aggregator}`)}: ${field.name || field.fid}`,
        };
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
                    {intl.get('breakout.measure_empty')}
                </p>
            )}
            {validMeasures.map(f => {
                const isCurrent = mainField?.fid === f.fid;
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
                        className={isCurrent ? 'current' : ''}
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
    const { fields, comparisonFilters } = context;

    return (
        <ConfigButton button={{ label: intl.get('breakout.compare'), iconProps: { iconName: 'Settings' } }}>
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
