import React, { useRef, useState, useCallback } from 'react';
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
                <button className="inline-block min-w-96 text-xs mr-2 pt-1 pb-1 pl-6 pr-6 border border-gray-500 rounded-sm cursor-pointer hover:bg-gray-200"
                    onClick={() => { if (fileRef.current) { fileRef.current.click(); }}}
                >
                    上传数据
                </button>
                <button className="inline-block min-w-96 text-xs mr-2 pt-1 pb-1 pl-6 pr-6 bg-indigo-600 rounded-sm hover:bg-indigo-500 text-white font-bold"
                    disabled={tmpDataSource.length === 0}
                    onClick={() => { onSubmitData(); }}
                >
                    确认
                </button>
            </div>
            <div className="mt-1 mb-1">
                <label className="block text-xs text-gray-800">数据集名称</label>
                <input type="text" placeholder="数据集名称"
                    onChange={e => {
                        store.updateTempName(e.target.value)
                    }}
                    className="text-xs p-1 border border-gray-300 outline-none focus:outline-none focus:border-blue-500"
                />
            </div>
            <Table />
        </Container>
    );
}

export default observer(DataSourcePanel);
