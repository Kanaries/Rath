import React, { useRef, useState, useCallback } from 'react';
import { Button, TextField } from '@tableau/tableau-ui';
import { FileReader } from '@kanaries/web-data-loader';
import { Record } from '../interfaces';
import Table from './table';
import styled from 'styled-components';
import { useGlobalStore } from '../store';
import { observer } from 'mobx-react-lite';

const Container = styled.div`
    overflow-x: auto;
`;

interface DSPanelProps {
}
const DataSourcePanel: React.FC<DSPanelProps> = props => {
    const fileRef = useRef<HTMLInputElement>(null);
    const store = useGlobalStore();
    const { tmpDSName, tmpDataSource } = store;

    const onSubmitData = useCallback(() => {
        store.commitTempDS();
    }, [])
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
                            store.updateTempDS(data as Record[]);
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
                <Button kind="primary" disabled={tmpDataSource.length === 0} onClick={() => {
                    onSubmitData();
                }}>确认</Button>
            </div>
            <div style={{ margin: '1em 0em' }}>
                <TextField label="数据集名称" value={tmpDSName} onChange={(e) => {
                    store.updateTempName(e.target.value)
                }} />
            </div>
            <Table />
        </Container>
    );
}

export default observer(DataSourcePanel);
