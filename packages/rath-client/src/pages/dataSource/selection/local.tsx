import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { IMuteFieldBase, IRow } from '../../../interfaces';
import { deleteDataStorageById, getDataStorageById, getDataStorageList, IDBMeta } from '../../../utils/storage';
import styled from 'styled-components';
import { IconButton } from 'office-ui-fabric-react';

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

interface LocalDataProps {
    onClose: () => void;
    onStartLoading: () => void;
    onLoadingFailed: (err: any) => void;
    onDataLoaded: (fields: IMuteFieldBase[], dataSource: IRow[]) => void;
}
const Local: React.FC<LocalDataProps> = props => {
    const { onDataLoaded, onLoadingFailed, onClose } = props;
    const [localDataList, setLocalDataList] = useState<IDBMeta[]>([]);
    useEffect(() => {
        getDataStorageList().then((dataList) => {
            setLocalDataList(dataList);
        })
    }, [])
    return <LocalCont>
        <h1>History</h1>
        <div>
            {
                localDataList.map(local => <DataItem key={local.id}>
                    <div className="desc-container">
                        <h2>{local.name}</h2>
                        <div>size: {local.size} KB</div>
                        <div>time: {dayjs(local.createTime).format('YYYY-MM-DD HH:mm:ss')}</div>
                    </div>
                    <div className="button-container">
                        <IconButton
                            iconProps={{ iconName: 'CloudDownload' }}
                            title="Load"
                            onClick={() => {
                                getDataStorageById(local.id).then(res => {
                                    onDataLoaded(res.fields, res.dataSource);
                                    onClose()
                                }).catch(onLoadingFailed)
                            }}
                        />
                        <IconButton
                            title="Delete"
                            iconProps={{ iconName: 'delete', color: 'red' }}
                            onClick={() => {
                                deleteDataStorageById(local.id)
                            }}
                        />
                    </div>
                </DataItem>)
            }
        </div>
    </LocalCont>
}

export default Local;
