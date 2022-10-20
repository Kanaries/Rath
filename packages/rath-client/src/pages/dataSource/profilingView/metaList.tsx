// metaList compoent

import React from 'react';
import styled from 'styled-components';
import { IFieldMeta } from '../../../interfaces';
import DistributionChart from '../metaView/distChart';

const ColumnItem = styled.div`
    padding: 2px;
    margin: 2px;
    border-bottom: 1px solid #dedede;
    cursor: pointer;
    canvas {
        cursor: pointer;
    }
`;

const MetaContainer = styled.div`
    flex-grow: 0;
    flex-shrink: 0;
    overflow-y: auto;
    max-height: 600px;
    border-right: 1px solid #dedede;
`;

interface MetaListProps {
    columnIndex: number;
    onColumnIndexChange: (index: number) => void;
    fieldMetas: IFieldMeta[];
}

const MetaList: React.FC<MetaListProps> = (props) => {
    const { fieldMetas, onColumnIndexChange } = props;
    return (
        <MetaContainer>
            {fieldMetas.map((fm, fIndex) => (
                <ColumnItem
                    key={fm.fid}
                    onClick={() => {
                        onColumnIndexChange(fIndex);
                    }}
                >
                    <h1>{fm.name}</h1>
                    <DistributionChart
                        dataSource={fm.distribution}
                        x="memberName"
                        y="count"
                        height={70}
                        width={220}
                        maxItemInView={16}
                        analyticType={fm.analyticType}
                        semanticType={fm.semanticType}
                    />
                </ColumnItem>
            ))}
        </MetaContainer>
    );
};

export default MetaList;
