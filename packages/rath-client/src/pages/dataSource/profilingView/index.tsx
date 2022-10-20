import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import styled from 'styled-components';
import { useGlobalStore } from '../../../store';
import MetaDetail from './metaDetail';
import MetaList from './metaList';

const Cont = styled.div`
    display: flex;
    width: 100%;
    overflow-x: auto;
    border-top: 1px solid #eee;
    margin-top: 8px;
`;

const ProfilingVieiw: React.FC = (props) => {
    const { dataSourceStore } = useGlobalStore();
    const { fieldMetas } = dataSourceStore;
    const [columnIndex, setColumnIndex] = useState<number>(0);
    if (fieldMetas.length === 0) return <div></div>;
    return (
        <Cont>
            <MetaList fieldMetas={fieldMetas} onColumnIndexChange={setColumnIndex} columnIndex={columnIndex} />
            <MetaDetail field={fieldMetas[columnIndex]} />
        </Cont>
    );
};

export default observer(ProfilingVieiw);
