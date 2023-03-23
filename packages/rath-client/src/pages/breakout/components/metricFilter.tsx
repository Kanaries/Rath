import { Icon } from "@fluentui/react";
import type { IFieldMeta, IFilter } from "@kanaries/loa";
import produce from "immer";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { nanoid } from "nanoid";
import { Fragment } from "react";
import styled from "styled-components";
import FilterCreationPill from "../../../components/fieldPill/filterCreationPill";
import ViewField from "../../megaAutomation/vizOperation/viewField";
import type { IUniqueFilter } from "../store";
import { formatFilterRule } from "../utils/format";


const Container = styled.div`
    margin: 1rem;
    display: grid;
    column-gap: 1rem;
    grid-template-columns: repeat(2, max-content);
`;

export interface IMetricFilterProps {
    fields: IFieldMeta[];
    filters: readonly IFilter[];
    onChange: (value: IFilter[]) => void;
}

export const flatFilterRules = (rules: readonly IFilter[]): IUniqueFilter[] => {
    if (!rules) {
        return [];
    }
    return rules.map(rule => ({
        ...rule,
        id: nanoid(),
    }));
};

const MetricFilter = observer<IMetricFilterProps>(function MetricFilter ({ fields, filters: value, onChange }) {
    const flatFilters = flatFilterRules(value).reduce<{ field: IFieldMeta; filter: IUniqueFilter }[]>((list, filter) => {
        const field = fields.find(f => f.fid === filter.fid);
        if (field) {
            list.push({ field, filter });
        }
        return list;
    }, []);

    const handleAddFilter = (filter: IUniqueFilter) => {
        onChange([...value, filter]);
    };

    const submitFlatFilters = (filters: IUniqueFilter[]) => {
        onChange(filters);
    };
    
    return (
        <Container>
            {/* applied filters (flattened) */}
            {flatFilters.map((f, i) => {
                return (
                    <Fragment key={i}>
                        <span />
                        <ViewField
                            type={f.field.analyticType}
                            text={formatFilterRule(f.filter, f.field)}
                            onRemove={() => {
                                submitFlatFilters(produce(flatFilters.map(f => toJS(f.filter)), draft => {
                                    draft.splice(i, 1);
                                }));
                            }}
                        />
                    </Fragment>
                );
            })}
            {/* new filter */}
            <Icon
                iconName="Add"
            />
            <FilterCreationPill
                fields={fields}
                onFilterSubmit={(_, filter) => handleAddFilter({ ...filter, id: nanoid() })}
            />
        </Container>
    );
});


export default MetricFilter;
