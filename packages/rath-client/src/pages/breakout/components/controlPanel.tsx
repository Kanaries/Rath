import { useRef } from "react";
import { Dropdown, Stack } from "@fluentui/react";
import { observer } from "mobx-react-lite";
import produce from "immer";
import type { IFieldMeta } from "@kanaries/loa";
import styled from "styled-components";
import { CategoricalMetricAggregationTypes, CompareTarget, MetricAggregationType, NumericalMetricAggregationTypes, useBreakoutStore } from "../store";
import ConfigButton, { IConfigButtonRef } from "./configButton";
import MetricFilter from "./metricFilter";


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

const ControlPanel = observer(function ControlPanel () {
    const context = useBreakoutStore();
    const { dataSourceStore, compareTarget } = context;
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
        </Stack>
    );
});


export default ControlPanel;
