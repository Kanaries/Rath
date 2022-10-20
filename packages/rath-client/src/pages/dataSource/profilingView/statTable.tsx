import React from 'react';
import styled from 'styled-components';
import { IFieldMeta } from '../../../interfaces';
import { formatNumbers } from './utils';

const Table = styled.table`
    font-size: 12px;
    thead {
        font-weight: 500;
        font-size: 14px;
    }
`

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
                    <td>Unique Values</td>
                    <td align="right">{features.unique}</td>
                </tr>
                <tr>
                    <td>Count</td>
                    <td align="right">{features.count}</td>
                </tr>
                {semanticType === 'quantitative' && (
                    <React.Fragment>
                        <tr>
                            <td>Max</td>
                            <td align="right">{formatNumbers(features.max)}</td>
                        </tr>
                        <tr>
                            <td>Min</td>
                            <td align="right">{formatNumbers(features.min)}</td>
                        </tr>
                        <tr>
                            <td>Mean</td>
                            <td align="right">{formatNumbers(features.mean)}</td>
                        </tr>
                        <tr>
                            <td>Sum</td>
                            <td align="right">{formatNumbers(features.sum)}</td>
                        </tr>
                    </React.Fragment>
                )}
            </tbody>
        </Table>
    );
};

export default StatTable;
