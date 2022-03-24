import React from 'react';
import { IMutField } from '../interfaces';
import styled from 'styled-components';
import { observer } from 'mobx-react-lite';
import { useGlobalStore } from '../store';
import DataTypeIcon from '../components/dataTypeIcon';

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
                padding: 12px;
                background-color: #f7f7f7;
                margin: 2px;
                white-space: nowrap;
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
                padding: 4px 12px;
                color: #434343;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
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
// function getCellType(field: IMutField): 'number' | 'text' {
//     return field.dataType === 'number' || field.dataType === 'integer' ? 'number' : 'text';
// }
function getHeaderType(field: IMutField): 'number' | 'text' {
    return field.analyticType === 'dimension'? 'text' : 'number';
}

const Table: React.FC<TableProps> = props => {
    const { size = 10 } = props;
    const { commonStore } = useGlobalStore();
    const { tmpDSRawFields, tmpDataSource } = commonStore;
 
    return (
        <Container>
            <table>
                <thead>
                    <tr>
                        {tmpDSRawFields.map((field, fIndex) => (
                            <th key={field.fid} className={getHeaderType(field)}>
                                {/* <DataTypeIcon dataType={field.dataType} /> <b>{field.key}</b> */}
                                <div>
                                    <select
                                        className="border-b border-gray-300 hover:bg-gray-100 hover:border-gray-600"
                                        value={field.analyticType} onChange={(e) => {
                                        commonStore.updateTempFieldAnalyticType(field.fid, e.target.value as IMutField['analyticType'])
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
                                    key={field.fid + index}
                                    // className={getCellType(field)}
                                >
                                    {record[field.fid]}
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
