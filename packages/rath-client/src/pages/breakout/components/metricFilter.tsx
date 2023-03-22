import { Icon } from "@fluentui/react";
import type { IFieldMeta } from "@kanaries/loa";
import produce from "immer";
import { observer } from "mobx-react-lite";
import { nanoid } from "nanoid";
import { Fragment } from "react";
import styled from "styled-components";
import FilterCreationPill from "../../../components/fieldPill/filterCreationPill";
import ViewField from "../../megaAutomation/vizOperation/viewField";
import { FilterRule, IUniqueFilter } from "../store";


const Container = styled.div`
    margin: 1rem;
    display: grid;
    column-gap: 1rem;
    grid-template-columns: repeat(2, max-content);
`;

export interface IMetricFilterProps {
    fields: IFieldMeta[];
    value: FilterRule | null;
    onChange: (value: FilterRule | null) => void;
}

export const flatFilterRules = (rules: FilterRule | null): IUniqueFilter[] => {
    if (!rules) {
        return [];
    }
    if ('when' in rules) {
        const res = [rules.when];
        if ('and' in rules && rules.and) {
            res.push(...flatFilterRules(rules.and));
        }
        return res;
    }
    return [];
};

const MetricFilter = observer<IMetricFilterProps>(function MetricFilter ({ fields, value, onChange }) {
    // TODO: not only flat
    const flatFilters = flatFilterRules(value).reduce<{ field: IFieldMeta; filter: IUniqueFilter }[]>((list, filter) => {
        const field = fields.find(f => f.fid === filter.fid);
        if (field) {
            list.push({ field, filter });
        }
        return list;
    }, []);

    const handleAddFilter = (filter: IUniqueFilter) => {
        onChange(value ? produce(value, draft => {
            if (!('when' in draft)) {
                return;
            }
            let parent: { when: IUniqueFilter; and?: FilterRule } = draft;
            while (parent.and && 'when' in parent.and) {
                parent = parent.and;
            }
            parent.and = {
                when: filter,
            };
        }) : { when: filter });
    };

    const submitFlatFilters = (filters: IUniqueFilter[]) => {
        if (filters.length === 0) {
            return onChange(null);
        }
        const root: { when: IUniqueFilter; and?: FilterRule } = {
            when: filters[0],
        };
        let cursor = root;
        for (const f of filters.slice(1)) {
            cursor.and = { when: f };
            cursor = cursor.and;
        }
        onChange(root);
    };
    
    return (
        <Container>
            {/* applied filters (flattened) */}
            {flatFilters.map((f, i) => {
                let filterDesc = `${f.field.name || f.field.fid} ∈ `;
                filterDesc += f.filter.type === 'range' ? `[${f.filter.range.join(',')}]` : `{${f.filter.values.join(',')}}`;
                return (
                    <Fragment key={i}>
                        <span />
                        <ViewField
                            type={f.field.analyticType}
                            text={filterDesc}
                            onRemove={() => {
                                submitFlatFilters(produce(flatFilters.map(f => f.filter), draft => {
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
