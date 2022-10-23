import { DetailsList, DetailsListLayoutMode, IColumn, SelectionMode } from '@fluentui/react';
import React from 'react';
import styled from 'styled-components';
import { IRow } from '../../../interfaces';
import { useGlobalStore } from '../../../store';

const Cont = styled.div`
    overflow: auto;
    max-height: 200px;
    width: auto;
    max-width: 880px;
`

interface DetailTableProps {
    data: IRow[]
}
const DetailTable: React.FC<DetailTableProps> = (props) => {
    const { data } = props
    const { dataSourceStore } = useGlobalStore();
    const { fieldMetas } = dataSourceStore;
    const columns: IColumn[] = fieldMetas.map(fm => {
        return {
            key: fm.fid,
            name: fm.name || '',
            fieldName: fm.fid,
            minWidth: 100,
            maxWidth: 200,
            isResizable: true,
        }
    })
    return <Cont>
        <DetailsList
            layoutMode={DetailsListLayoutMode.justified}
            columns={columns}
            items={data}
            isHeaderVisible={true}
            selectionMode={SelectionMode.none}
            compact
            
        />
    </Cont>
}

export default DetailTable;