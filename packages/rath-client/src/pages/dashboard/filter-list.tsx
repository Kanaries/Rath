import { ActionButton, IconButton } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import type { FC } from 'react';
import styled from 'styled-components';
import FilterCreationPill from '../../components/fieldPill/filterCreationPill';
import { useGlobalStore } from '../../store';
import type { DashboardDocument, DashboardDocumentOperators } from '../../store/dashboardStore';
import type { IFieldMeta, IFilter } from '../../interfaces';

const Container = styled.div``;

const Cell = styled.div`
    user-select: none;
    font-size: 0.8rem;
    margin: 0.8em 0;
    padding: 0.6em 1.2em;
    box-shadow: 0 1.6px 3.6px 0 rgb(0 0 0 / 13%), 0 0.3px 0.9px 0 rgb(0 0 0 / 11%);
    position: relative;
    > div {
        padding: 0.2em 0;
        line-height: 1.6em;
        min-height: 1.6em;
    }
    > button {
        position: absolute;
        right: 0;
        top: 0;
        color: #da3b01;
        :hover {
            color: #da3b01;
        }
    }
`;

interface FieldCellProps {
    field: IFieldMeta;
    data: IFilter;
    remove: () => void;
}

const FilterCell: FC<FieldCellProps> = ({ field, data, remove }) => {
    const filterDesc = `∈ ${data.type === 'range' ? `[${data.range.join(',')}]` : `{${data.values.map((v) => JSON.stringify(v)).join(',')}}`}`;

    return (
        <Cell>
            <div>{field.name || field.fid}</div>
            <div>{filterDesc}</div>
            <IconButton
                iconProps={{
                    iconName: 'Delete',
                }}
                onClick={remove}
            />
        </Cell>
    );
};

export interface FilterListProps {
    page: DashboardDocument;
    operators: DashboardDocumentOperators;
}

const FilterList: FC<FilterListProps> = ({ page, operators }) => {
    const { dataSourceStore } = useGlobalStore();
    const { fieldMetas } = dataSourceStore;

    return (
        <Container>
            <FilterCreationPill
                fields={fieldMetas}
                onFilterSubmit={(_, filter) => operators.addDataFilter(filter)}
                onRenderPill={(text, handleClick) => (
                    <ActionButton label={text} iconProps={{ iconName: 'Add' }} onClick={handleClick}>
                        {text}
                    </ActionButton>
                )}
            />
            {page.config.filters.map((filter, i) => {
                const field = fieldMetas.find((f) => f.fid === filter.fid);

                return field ? <FilterCell key={i} field={field} data={filter} remove={() => operators.removeDataFilter(i)} /> : null;
            })}
        </Container>
    );
};

export default observer(FilterList);
