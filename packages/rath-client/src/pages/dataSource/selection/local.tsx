import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import styled from 'styled-components';
import { IconButton } from '@fluentui/react';
import { IMuteFieldBase, IRow } from '../../../interfaces';
import { deleteDataStorageById, getDataStorageById, getDataStorageList, IDBMeta } from '../../../utils/storage';


const LocalCont = styled.div`
    .items-container{
        max-height: 500px;
        overflow-y: auto;
    }
`
const DataItem = styled.div`
    border-radius: 3px;
    border: 1px solid #ffa940;
    padding: 6px;
    margin: 6px 0px;
    background-color: #fff7e6;
    display: flex;
    .desc-container{
        flex-grow: 1;
    }
    .button-container {
        width: 120px;
        display: flex;
        align-items: center;
    }
`

function formatSize(size: number) {
    if (size < 1024) {
        return `${size}B`;
    }
    if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(2)}KB`;
    }
    if (size < 1024 * 1024 * 1024) {
        return `${(size / 1024 / 1024).toFixed(2)}MB`;
    }
    return `${(size / 1024 / 1024 / 1024).toFixed(2)}GB`;
}

interface LocalDataProps {
    onClose: () => void;
    onStartLoading: () => void;
    onLoadingFailed: (err: any) => void;
    onDataLoaded: (fields: IMuteFieldBase[], dataSource: IRow[], name?: string) => void;
}
const Local: React.FC<LocalDataProps> = props => {
    const { onDataLoaded, onLoadingFailed, onClose } = props;
    const [localDataList, setLocalDataList] = useState<IDBMeta[]>([]);
    useEffect(() => {
        getDataStorageList().then((dataList) => {
            setLocalDataList(dataList);
        })
    }, [])
    const totalSize = useMemo(() => {
        return localDataList.reduce((acc, cur) => {
            return acc + cur.size;
        }, 0)
    }, [localDataList])
    return <LocalCont>
        <h1>History</h1>
        <p>total: {localDataList.length} datasets. {formatSize(totalSize * 1024)}</p>
        <div style={{ maxHeight: '500px', overflowY: 'auto'}}>
            {
                localDataList.map(local => <DataItem key={local.id}>
                    <div className="desc-container">
                        <h2>{local.name}</h2>
                        <div>size: {formatSize(local.size * 1024)}</div>
                        <div>time: {dayjs(local.createTime).format('YYYY-MM-DD HH:mm:ss')}</div>
                    </div>
                    <div className="button-container">
                        <IconButton
                            iconProps={{ iconName: 'CloudDownload' }}
                            title="Load"
                            onClick={() => {
                                getDataStorageById(local.id).then(res => {
                                    onDataLoaded(res.fields, res.dataSource, local.id);
                                    onClose()
                                }).catch(onLoadingFailed)
                            }}
                        />
                        <IconButton
                            title="Delete"
                            iconProps={{ iconName: 'delete', color: 'red' }}
                            onClick={() => {
                                deleteDataStorageById(local.id).then(res => {
                                    getDataStorageList().then((dataList) => {
                                        setLocalDataList(dataList);
                                    })
                                })
                            }}
                        />
                    </div>
                </DataItem>)
            }
        </div>
    </LocalCont>
}

export default Local;
