// metaList compoent

import React from 'react';
import styled from 'styled-components';
import { IFieldMeta } from '../../../interfaces';
import DistributionChart from '../metaView/distChart';
import { RATH_THEME_CONFIG } from '../../../theme';

const ColumnItem = styled.div`
    padding: 2px;
    margin: 0px 2px 2px 2px;
    /* border-bottom: 1px solid var(--border); */
    cursor: pointer;
    canvas {
        cursor: pointer;
    }
    position: relative;
    .bottom-bar {
        position: absolute;
        height: 2px;
        border-radius: 0px 0px 2px 2px;
        left: 0px;
        right: 0px;
        top: 0px;
        margin: 0px 1px;
    }
    .dimension {
        background-color: ${RATH_THEME_CONFIG.dimensionColor};
    }
    .measure {
        background-color: ${RATH_THEME_CONFIG.measureColor};
    }
    .disable {
        background-color: ${RATH_THEME_CONFIG.disableColor};
    }
`;

const MetaContainer = styled.div`
    flex-grow: 0;
    flex-shrink: 0;
    overflow-y: auto;
    max-height: 600px;
    border-right: 1px solid var(--border);
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
                    <div className={`${fm.analyticType} bottom-bar`}></div>
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
