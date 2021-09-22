import React, { useRef, useState, useCallback } from 'react';
import { Button, TextField } from '@tableau/tableau-ui';
import { FileReader } from '@kanaries/web-data-loader';
import { Record, IField, IMutField } from '../interfaces';
import { Insight } from 'visual-insights';
import Table from './table';
import styled from 'styled-components';
import { useLocalState } from '../store';

const Container = styled.div`
    overflow-x: auto;
    table {
        box-sizing: content-box;
        font-family: Lato, 'Helvetica Neue', Arial, Helvetica, sans-serif;
        border-collapse: collapse;
        thead {
            td {
                text-align: left;
            }
        }
        tbody {
            td.number {
                text-align: right;
            }
            td.text {
                text-align: left;
            }
        }
    }
`;
function transData(dataSource: Record[]): {
    dataSource: Record[];
    fields: IMutField[]
} {
    if (dataSource.length === 0) return {
        dataSource: [],
        fields: []
    };
    let ans: Record[] = [];
    const keys = Object.keys(dataSource[0]);
    // TODO: 冗余设计，单变量统计被进行了多次重复计算。另外对于这种不完整的分析任务，不建议使用VIEngine。
    const vie = new Insight.VIEngine();
    vie.setData(dataSource)
        .setFields(keys.map(k => ({
            key: k,
            analyticType: '?',
            dataType: '?',
            semanticType: '?'
        })))
    // TODO: 结合上面的TODO，讨论，VIEngine是否要提供不需要进行univarSelection就提供summary的接口。
    // 这里我们使用了一种非原API设计时期待的用法，即强制指定单变量选择时要全选字段。但我们无法阻止对变量的转换。
    vie.univarSelection('percent', 1);
    const fields = vie.fields;
    // console.log(fields)
    for (let record of dataSource) {
        const newRecord: Record = {};
        for (let field of fields) {
            if (field.dataType === 'number' || field.dataType === 'integer') {
                newRecord[field.key] = Number(record[field.key])
            } else {
                newRecord[field.key] = record[field.key]
            }
        }
        ans.push(newRecord);
    }
    return {
        dataSource: ans,
        fields: fields.map(f => ({
            key: f.key,
            analyticType: f.analyticType,
            dataType: f.dataType,
            semanticType: f.semanticType
        }))
    }
}
interface DSPanelProps {
    dbIndex: number;
    onSubmit?: () => void
}
const DataSourcePanel: React.FC<DSPanelProps> = props => {
    const { dbIndex, onSubmit } = props;
    const fileRef = useRef<HTMLInputElement>(null);
    const [dataSource, setDataSource] = useState<Record[]>([]);
    const [rawFields, setRawFields] = useState<IMutField[]>([]);
    const [, updateGS] = useLocalState();
    const [dsName, setDSName] = useState<string>('新数据集')

    const onFieldsChange = useCallback((fields: IMutField[]) => {
        setRawFields(fields);
    }, [])



    const onSubmitData = useCallback(() => {
        updateGS(draft => {
            draft.dataBase[dbIndex] = {
                id: 'test' + dbIndex,
                name: dsName,
                rawFields,
                dataSource
            }
        })
        if (onSubmit) {
            onSubmit();
        }
    }, [dbIndex, rawFields, dataSource, dsName])
    return (
        <Container>
            <input
                style={{ display: 'none' }}
                type="file"
                ref={fileRef}
                onChange={(e) => {
                    const files = e.target.files;
                    if (files !== null) {
                        const file = files[0];
                        FileReader.csvReader({
                            file,
                            config: { type: 'reservoirSampling', size: Infinity },
                            onLoading: () => {}
                        }).then((data) => {
                            // console.log(data)
                            const result = transData(data as Record[]);
                            console.log(result);
                            // TODO: need fix web-data-loader issue #2
                            setDataSource(result.dataSource.slice(0, -1));
                            setRawFields(result.fields);
                        });
                    }
                }}
            />
            <div style={{ margin: '1em 0em' }}>
                <Button
                    style={{ marginRight: 12 }}
                    onClick={() => {
                        if (fileRef.current) {
                            fileRef.current.click();
                        }
                    }}
                >
                    上传数据
                </Button>
                <Button kind="primary" disabled={dataSource.length === 0} onClick={() => {
                    onSubmitData();
                }}>确认</Button>
            </div>
            <div style={{ margin: '1em 0em' }}>
                <TextField label="数据集名称" value={dsName} onChange={(e) => {
                    setDSName(e.target.value)
                }} />
            </div>
            <Table dataSource={dataSource} fields={rawFields} onFieldsUpdate={onFieldsChange} />
        </Container>
    );
}

export default DataSourcePanel;
