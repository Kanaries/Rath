import { IFilter } from '@kanaries/loa';
import React from 'react';
import styled from 'styled-components';
import { IFieldMeta } from '../../interfaces';
import ViewField from '../../pages/megaAutomation/vizOperation/viewField';

const Cont = styled.div`
    .chart-desc {
        font-size: 12px;
    }
    .fields-container{
        display: flex;
        padding: 1em 0em 0em 0em;
        flex-wrap: wrap;
    }
`;

interface ViewInfoProps {
    fields: IFieldMeta[];
    filters?: IFilter[];
    metas: IFieldMeta[];
}
const PillInfo: React.FC<ViewInfoProps> = (props) => {
    const { fields, filters, metas } = props;
    return (
        <Cont>
            <div className="fields-container">
                {fields.map((f: IFieldMeta) => (
                    <ViewField key={f.fid} type={f.analyticType} text={f.name || f.fid} />
                ))}
            </div>
            <div className="fields-container">
                {filters &&
                    filters.map((f) => {
                        const targetField = metas.find((m) => m.fid === f.fid);
                        if (!targetField) return null;
                        let filterDesc = `${targetField.name || targetField.fid} ∈ `;
                        filterDesc += f.type === 'range' ? `[${f.range.join(',')}]` : `{${f.values.join(',')}}`;
                        return <ViewField key={f.fid} type={targetField.analyticType} text={filterDesc} />;
                    })}
            </div>
        </Cont>
    );
};

export default PillInfo;
