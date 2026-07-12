import React from 'react';
import styled from 'styled-components';
import { RathColumn, RathDataTable } from '../../../components/rath-ui/rath-data-table';
import { IRow } from '../../../interfaces';
import { useGlobalStore } from '../../../store';

const Cont = styled.div`
    width: auto;
    max-width: 880px;
`;

interface DetailTableProps {
    data: IRow[];
}
const DetailTable: React.FC<DetailTableProps> = (props) => {
    const { data } = props;
    const { dataSourceStore } = useGlobalStore();
    const { fieldMetas } = dataSourceStore;
    const columns: RathColumn<IRow>[] = fieldMetas.map((fm) => {
        return {
            key: fm.fid,
            name: fm.name || '',
            fieldName: fm.fid,
            minWidth: 100,
            maxWidth: 200,
        };
    });
    return (
        <Cont>
            <RathDataTable
                columns={columns}
                items={data}
                isHeaderVisible
                compact
                maxHeight={200}
                virtualizationThreshold={40}
            />
        </Cont>
    );
};

export default DetailTable;
