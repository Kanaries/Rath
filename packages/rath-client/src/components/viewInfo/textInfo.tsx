import { IFilter } from '@kanaries/loa';
import React from 'react';
import styled from 'styled-components';
import { IFieldMeta } from '../../interfaces';

const Cont = styled.div`
    .chart-desc {
        font-size: 12px;
    }
`;

interface ViewInfoProps {
    fields: IFieldMeta[];
    filters?: IFilter[];
    metas: IFieldMeta[];
}
const ViewInfo: React.FC<ViewInfoProps> = (props) => {
    const { fields, filters, metas } = props;
    return (
        <Cont>
            <div className="chart-desc">
                <div>
                    {fields
                        .filter((f) => f.analyticType === 'dimension')
                        .map((f) => f.name || f.fid)
                        .join(', ')}{' '}
                </div>
                <div>
                    {fields
                        .filter((f) => f.analyticType === 'measure')
                        .map((f) => f.name || f.fid)
                        .join(', ')}{' '}
                </div>
                {filters &&
                    filters.map((f) => {
                        const meta = metas.find((m) => m.fid === f.fid);
                        if (!meta) return '';
                        return `${meta.name || meta.fid} = ${
                            f.type === 'set' ? f.values.join(',') : `[${f.range.join(',')}]`
                        }`;
                    })}
            </div>
        </Cont>
    );
};

export default ViewInfo;
