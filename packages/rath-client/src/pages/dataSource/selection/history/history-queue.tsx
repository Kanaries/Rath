import intl from 'react-intl-universal';
import { observer } from "mobx-react-lite";
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { DataSourceTag, getDataStorageById, getDataStorageList, IDBMeta } from "../../../../utils/storage";
import type { IMuteFieldBase, IRow } from '../../../../interfaces';
import HistoryQueueItem from './history-queue-item';


const Container = styled.div`
    display: flex;
    flex-direction: column;
    max-width: 680px;
    max-height: 50vh;
    overflow: hidden auto;
`;

const Queue = styled.div`
    margin: 1em 0 1.2em;
    overflow: scroll hidden;
    display: flex;
    flex-direction: row;
    > * {
        flex-grow: 0;
        flex-shrink: 0;
    }
    ::-webkit-scrollbar {
        display: none;
    }
`;

const MAX_QUEUE_SIZE = 64;

export interface IHistoryQueueProps {
    onClose: () => void;
    onLoadingFailed: (err: any) => void;
    onDataLoaded: (fields: IMuteFieldBase[], dataSource: IRow[], name: string, tag: DataSourceTag, withHistory: IDBMeta) => void;
    /** @default "mark" */
    sortBy?: 'mark' | 'latest' | 'views';
    search?: string;
}

const HistoryQueue: FC<IHistoryQueueProps> = ({ onDataLoaded, onClose, onLoadingFailed, sortBy = 'mark', search }) => {
    const [localDataList, setLocalDataList] = useState<IDBMeta[]>([]);
    const prevList = useRef(localDataList);
    prevList.current = localDataList;

    const fetchDataStorageList = useCallback((sort = true) => {
        getDataStorageList().then((list) => {
            if (sort === false) {
                const next = prevList.current.map(item => list.find(which => which.id === item.id)!).filter(Boolean);
                setLocalDataList(next);
                return;
            }
            const marked = list.filter(item => item.userTagGroup !== undefined);
            const sorted = marked.sort((a, b) => b.editTime - a.editTime).sort(
                (a, b) => (a.userTagGroup ?? 1023) - (b.userTagGroup ?? 1023)
            );
            switch (sortBy) {
                case 'latest': {
                    sorted.sort((a, b) => b.editTime - a.editTime);
                    break;
                }
                case 'views': {
                    sorted.sort((a, b) => (b.views ?? 1) - (a.views ?? 1));
                    break;
                }
                default: {
                    break;
                }
            }
            const next = sorted.slice(0, MAX_QUEUE_SIZE);
            setLocalDataList(next);
        });
    }, [sortBy]);
    
    useEffect(() => {
        fetchDataStorageList();
    }, [fetchDataStorageList]);

    const handleLoadHistory = useCallback((meta: IDBMeta) => {
        getDataStorageById(meta.id).then(res => {
            onDataLoaded(res.fields, res.dataSource, meta.name, meta.tag!, meta);
            onClose();
        }).catch(onLoadingFailed);
    }, [onClose, onDataLoaded, onLoadingFailed]);

    const list = useMemo(() => {
        if (!search) {
            return localDataList;
        }
        return localDataList.filter(item => {
            let temp = item.name.toLocaleLowerCase();
            for (const keyword of search.toLocaleLowerCase().split(/ +/)) {
                if (keyword.match(/^:.*$/)) {
                    switch (keyword) {
                        case ':is-marked': {
                            if (item.userTagGroup === undefined) {
                                return false;
                            }
                            break;
                        }
                        default: {
                            const { type } = /^:is-(?<type>.*)$/.exec(keyword)?.groups ?? {};
                            if (type && item.tag) {
                                if (item.tag.slice(1) !== type) {
                                    return false;
                                }
                            }
                            break;
                        }
                    }
                    continue;
                }
                const idx = temp.indexOf(keyword);
                if (idx === -1) {
                    return false;
                }
                temp = temp.slice(idx);
            }
            return true;
        });
    }, [localDataList, search]);

    return list.length > 0 ? (
        <Container>
            <header>
                {`${intl.get('dataSource.upload.history_queue')}`}
            </header>
            <Queue>
                {list.map((file, i) => (
                    <HistoryQueueItem
                        key={i}
                        file={file}
                        handleClick={handleLoadHistory}
                    />
                ))}
            </Queue>
        </Container>
    ) : null;
};

export default observer(HistoryQueue);
