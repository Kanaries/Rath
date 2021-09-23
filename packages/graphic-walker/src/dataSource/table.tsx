import React from 'react';
import { Record, IField, IMutField } from '../interfaces';
import styled from 'styled-components';
import { observer } from 'mobx-react-lite';
import { useGlobalStore } from '../store';

interface TableProps {
    size?: number;
}
const Container = styled.div`
    overflow-x: auto;
    table {
        box-sizing: content-box;
        font-family: Lato, 'Helvetica Neue', Arial, Helvetica, sans-serif;
        border-collapse: collapse;
        font-size: 12px;
        thead {
            th {
                text-align: left;
                border: 1px solid #f5f5f5;
                padding: 8px;
                margin: 2px;
            }
            th.number {
                border-top: 3px solid #5cdbd3;
            }
            th.text {
                border-top: 3px solid #69c0ff;
            }
        }
        tbody {
            td {
                border: 1px solid #f5f5f5;
                padding: 0px 8px;
            }
            td.number {
                text-align: right;
            }
            td.text {
                text-align: left;
            }
        }
    }
`;
const TYPE_LIST = [
    {
        value: 'dimension',
        label: '维度'
    },
    {
        value: 'measure',
        label: '度量'
    }
];
function getCellType(field: IMutField): 'number' | 'text' {
    return field.dataType === 'number' || field.dataType === 'integer' ? 'number' : 'text';
}
function getHeaderType(field: IMutField): 'number' | 'text' {
    return field.analyticType === 'dimension'? 'text' : 'number';
}
const Table: React.FC<TableProps> = props => {
    const { size = 10 } = props;
    const store = useGlobalStore();
    const { tmpDSRawFields, tmpDataSource } = store;
    return (
        <Container>
            <table>
                <thead>
                    <tr>
                        {tmpDSRawFields.map((field, fIndex) => (
                            <th key={field.key} className={getHeaderType(field)}>
                                <b>{field.key}</b>({field.dataType})
                                <div>
                                    <select
                                        className="border-b border-gray-300 hover:bg-gray-100 hover:border-gray-600"
                                        value={field.analyticType} onChange={(e) => {
                                        store.updateTempFieldAnalyticType(field.key, e.target.value as IMutField['analyticType'])
                                    }}>
                                        {
                                            TYPE_LIST.map(type => <option key={type.value} value={type.value}>{type.label}</option>)
                                        }
                                    </select>
                                </div>

                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {tmpDataSource.slice(0, size).map((record, index) => (
                        <tr key={index}>
                            {tmpDSRawFields.map((field) => (
                                <td
                                    key={field.key + index}
                                    className={getCellType(field)}
                                >
                                    {record[field.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </Container>
    );
}

export default observer(Table);
