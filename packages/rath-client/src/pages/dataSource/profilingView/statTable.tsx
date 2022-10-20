import React from 'react';
import styled from 'styled-components';
import intl from 'react-intl-universal'
import { IFieldMeta } from '../../../interfaces';
import { formatNumbers } from './utils';

const Table = styled.table`
    font-size: 12px;
    thead {
        font-weight: 500;
        font-size: 14px;
    }
`

const QuantitativeMetrics: string[] = [
    'min',
    'max',
    'mean',
    'qt_50',
    'qt_25',
    'qt_75',
    'stdev',
    // 'skewness',
    // 'kurtosis',
    // 'unique',
    // 'missing',
    // 'outliers',
    // 'distinct',
    // 'top',
    // 'bottom',
]

interface StatTableProps {
    title?: string;
    features: IFieldMeta['features'];
    semanticType: IFieldMeta['semanticType'];
}
const StatTable: React.FC<StatTableProps> = (props) => {
    const { title, features, semanticType } = props;
    return (
        <Table>
            <thead>
                <tr>
                    <td colSpan={2}>{title}</td>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>{intl.get("common.stat.unique")}</td>
                    <td align="right">{features.unique}</td>
                </tr>
                <tr>
                    <td>{intl.get("common.stat.count")}</td>
                    <td align="right">{features.count}</td>
                </tr>
                {semanticType === 'quantitative' && (
                    <React.Fragment>
                        {
                            QuantitativeMetrics.map((metric) => (<tr key={metric}>
                                <td>{intl.get(`common.stat.${metric}`)}</td>
                                <td align="right">{formatNumbers(features[metric])}</td>
                            </tr>))
                        }
                    </React.Fragment>
                )}
            </tbody>
        </Table>
    );
};

export default StatTable;
