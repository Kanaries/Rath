import intl from 'react-intl-universal';
import { Icon, IconButton, TooltipHost } from "@fluentui/react";
import { observer } from "mobx-react-lite";
import dayjs from 'dayjs';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import useBoundingClientRect from "../../../../hooks/use-bounding-client-rect";
import { deleteDataStorageById, getDataStorageById, getDataStorageList, IDBMeta } from "../../../../utils/storage";
import type { IMuteFieldBase, IRow } from '../../../../interfaces';
import getFileIcon from "./get-file-icon";


const List = styled.div`
    margin: 1em 0;
    height: 24em;
    overflow: hidden auto;
    display: grid;
    gap: 0.4em;
    grid-auto-rows: max-content;
`;

const ListItem = styled.div`
    display: flex;
    flex-direction: column;
    overflow: hidden;
    height: 100%;
    padding: 0.6em 1em 1.2em;
    border-radius: 2px;
    position: relative;
    > .head {
        display: flex;
        align-items: center;
        > i {
            flex-grow: 0;
            flex-shrink: 0;
            width: 2em;
            height: 2em;
            margin-right: 0.8em;
        }
        > div {
            flex-grow: 1;
            flex-shrink: 1;
            overflow: hidden;
            > header {
                font-size: 0.8rem;
                line-height: 1.2em;
                font-weight: 550;
                white-space: nowrap;
                color: #111;
            }
            > span {
                font-size: 0.6rem;
                line-height: 1.2em;
                color: #555;
            }
        }
    }
    .time {
        font-size: 0.5rem;
        color: #888;
    }
    > button {
        position: absolute;
        top: 0;
        right: 0;
        margin: 0;
        padding: 0;
        font-size: 12px;
        background-color: #d13438 !important;
        border-radius: 50%;
        color: #fff !important;
        width: 1.4em;
        height: 1.4em;
        i {
            font-weight: 1000;
            line-height: 1em;
            width: 1em;
            height: 1em;
            transform: scale(0.5);
        }
        visibility: hidden;
        opacity: 0.5;
        :hover {
            opacity: 1;
        }
    }
    :hover {
        background-color: #88888818;
        > button {
            visibility: visible;
        }
    }
    cursor: pointer;
`;

const ITEM_MIN_WIDTH = 240;
const MAX_HISTORY_SIZE = 64;
const MAX_RECENT_TIME = 1_000 * 60 * 60 * 24 * 31 * 3;  // 3 months

export function formatSize(size: number) {
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

interface IHistoryListProps {
    onClose: () => void;
    onLoadingFailed: (err: any) => void;
    onDataLoaded: (fields: IMuteFieldBase[], dataSource: IRow[], name?: string) => void;
}

const HistoryList: FC<IHistoryListProps> = ({ onDataLoaded, onClose, onLoadingFailed }) => {
    const [localDataList, setLocalDataList] = useState<IDBMeta[]>([]);
    
    useEffect(() => {
        getDataStorageList().then((dataList) => {
            const recent = dataList.filter(item => Date.now() - item.editTime < MAX_RECENT_TIME);
            const sorted = recent.sort((a, b) => b.editTime - a.editTime);
            setLocalDataList(sorted.slice(0, MAX_HISTORY_SIZE));
        });
    }, []);

    const listRef = useRef<HTMLDivElement>(null);
    const { width } = useBoundingClientRect(listRef, { width: true });
    const colCount = useMemo(() => Math.floor((width ?? (window.innerWidth * 0.6)) / ITEM_MIN_WIDTH), [width]);

    const handleLoadHistory = useCallback((id: string) => {
        getDataStorageById(id).then(res => {
            onDataLoaded(res.fields, res.dataSource, id);
            onClose();
        }).catch(onLoadingFailed);
    }, [onClose, onDataLoaded, onLoadingFailed]);

    const handleDeleteHistory = useCallback((id: string) => {
        deleteDataStorageById(id).then(() => {
            getDataStorageList().then((dataList) => {
                setLocalDataList(dataList);
            });
        });
    }, []);

    return (
        <List role="grid" ref={listRef} aria-colcount={colCount || 1} style={{ gridTemplateColumns: `repeat(${colCount || 1}, 1fr)` }}>
            {localDataList.map((file, i) => {
                const ext = /(?<=\.)[^.]+$/.exec(file.name)?.[0];

                return (
                    <ListItem
                        key={i}
                        role="gridcell"
                        aria-rowindex={Math.floor(i / colCount) + 1}
                        aria-colindex={(i % colCount) + 1}
                        tabIndex={0}
                        onClick={() => handleLoadHistory(file.id)}
                    >
                        <div className="head">
                            <Icon iconName={getFileIcon(file.name)} />
                            <div>
                                <header>
                                    <TooltipHost content={file.name}>
                                        <span>{file.name}</span>
                                    </TooltipHost>
                                </header>
                                <span>
                                    {`${ext ? `${ext} - ` : ''}${formatSize(file.size)}`}
                                </span>
                            </div>
                        </div>
                        <div className="time">
                            <p>{`${intl.get('dataSource.upload.lastOpen')}: ${dayjs(file.editTime).toDate().toLocaleString()}`}</p>
                        </div>
                        <IconButton
                            title="Delete"
                            iconProps={{ iconName: 'Clear' }}
                            onClick={e => {
                                e.stopPropagation();
                                handleDeleteHistory(file.id);
                            }}
                        />
                    </ListItem>
                );
            })}
        </List>
    );
};

export default observer(HistoryList);
