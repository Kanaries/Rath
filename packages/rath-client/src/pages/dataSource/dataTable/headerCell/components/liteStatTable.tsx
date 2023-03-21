import React from 'react';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import { IFieldMeta } from '../../../../../interfaces';
import { formatNumbers } from '../../../profilingView/utils';

const QuantitativeMetrics: string[] = ['min', 'max', 'mean', 'qt_50', 'stdev'];
const LiteTable = styled.table`
    font-size: 12px;
    padding: revert;
    margin: revert;
    border: revert;
    > thead {
        font-weight: 500;
        font-size: 14px;
    }
    > tbody > tr > td {
        padding: revert;
        background: revert;
        height: revert;
        border: none;
        border-right: revert;
        border-top-color: #f8f8f8 !important;
        border-bottom: revert;
    }
`;
interface LiteStatTableProps {
    features: IFieldMeta['features'];
    semanticType: IFieldMeta['semanticType'];
}
const LiteStatTable: React.FC<LiteStatTableProps> = (props) => {
    const { features, semanticType } = props;
    return (
        <LiteTable>
            <tbody>
                <tr>
                    <td>{intl.get('common.stat.unique')}</td>
                    <td align="right">{features.unique}</td>
                </tr>
                <tr>
                    <td>{intl.get('common.stat.count')}</td>
                    <td align="right">{features.count}</td>
                </tr>
                {semanticType === 'quantitative' &&
                    QuantitativeMetrics.map((metric) => (
                        <tr key={metric}>
                            <td>{intl.get(`common.stat.${metric}`)}</td>
                            <td align="right">{formatNumbers(features[metric])}</td>
                        </tr>
                    ))}
            </tbody>
        </LiteTable>
    );
};

export default LiteStatTable;
