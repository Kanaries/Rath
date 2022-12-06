import intl from 'react-intl-universal';
import { Icon, IconButton, TooltipHost } from "@fluentui/react";
import { observer } from "mobx-react-lite";
import dayjs from 'dayjs';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import useBoundingClientRect from "../../../../hooks/use-bounding-client-rect";
import { DataSourceTag, deleteDataStorageById, getDataStorageById, getDataStorageList, IDBMeta, updateDataStorageUserTagGroup, UserTagGroup, userTagGroupColors } from "../../../../utils/storage";
import type { IMuteFieldBase, IRow } from '../../../../interfaces';
import { RathDemoVirtualExt } from '../demo';
import { IDataSourceType } from '../../../../global';
import getFileIcon from './get-file-icon';


const allUserTagGroups = Object.keys(userTagGroupColors) as unknown as UserTagGroup[];

const UserTagGroupSize = 12;
const UserTagGroupPadding = 2;

const List = styled.div`
    margin: 1em 0;
    min-height: 8em;
    max-height: 50vh;
    max-width: 50vw;
    overflow: hidden auto;
    display: grid;
    gap: 0.4em;
    grid-auto-rows: max-content;
`;

const ListItem = styled.div`
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-width: ${(UserTagGroupSize + UserTagGroupPadding * 2) * ((allUserTagGroups.length - 1) * 0.8 + 1) + 10}px;
    height: 100%;
    padding: 1.2em 1em 1em 1.4em;
    border-radius: 2px;
    position: relative;
    box-shadow: inset 0 0 2px #8881;
    > .head {
        display: flex;
        align-items: center;
        > i {
            flex-grow: 0;
            flex-shrink: 0;
            width: 2em;
            height: 2em;
            margin-right: 0.8em;
            user-select: none;
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
                text-overflow: ellipsis;
                overflow: hidden;
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
        width: 1.2em;
        height: 1.2em;
        i {
            font-weight: 1000;
            line-height: 1em;
            width: 1em;
            height: 1em;
            transform: scale(0.4);
        }
        opacity: 0.5;
        :hover {
            opacity: 1;
        }
    }
    & .hover-only:not([aria-selected=true]) {
        visibility: hidden;
    }
    :hover {
        background-color: #8881;
        & .hover-only {
            visibility: visible;
        }
    }
    cursor: pointer;
`;

const UserTagGroupContainer = styled.div`
    position: absolute;
    left: 0;
    top: 0;
    display: flex;
    flex-direction: row;
    background-image: linear-gradient(to bottom, #8881, transparent 5px);
    padding: 0 5px;
    > svg {
        margin: 0 ${UserTagGroupPadding}px;
        cursor: pointer;
        transition: transform 200ms;
        transform: translateY(-67%);
        opacity: 0.2;
        :hover {
            opacity: 0.95;
            transform: translateY(-4px);
        }
        &[aria-selected=true] {
            opacity: 1;
            transform: translateY(-2px);
        }
        > * {
            pointer-events: none;
            filter: drop-shadow(0.8px 1px 0.6px #888);
        }
        :not(:first-child) {
            margin-left: ${-0.2 * UserTagGroupSize - UserTagGroupPadding}px;
        }
    }
`;

const ITEM_MIN_WIDTH = 200;
const MAX_HISTORY_SIZE = 64;
const MAX_RECENT_TIME = 1_000 * 60 * 60 * 24 * 31 * 3;  // 3 months

export function formatSize(size: number) {
    if (size < 1024) {
        return `${size.toFixed(2)}KB`;
    }
    if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(2)}MB`;
    }
    return `${(size / 1024 / 1024).toFixed(2)}GB`;
}

interface IHistoryListProps {
    onClose: () => void;
    onLoadingFailed: (err: any) => void;
    onDataLoaded: (fields: IMuteFieldBase[], dataSource: IRow[], name: string, tag: DataSourceTag, withHistory: IDBMeta) => void;
    is?: DataSourceTag;
}

const HistoryList: FC<IHistoryListProps> = ({ onDataLoaded, onClose, onLoadingFailed, is }) => {
    const [localDataList, setLocalDataList] = useState<IDBMeta[]>([]);
    const prevList = useRef(localDataList);
    prevList.current = localDataList;

    const fetchDataStorageList = useCallback((sort = true) => {
        getDataStorageList().then((dataList) => {
            if (sort === false) {
                const next = prevList.current.map(item => dataList.find(which => which.id === item.id)!).filter(Boolean);
                setLocalDataList(next);
                return;
            }
            const list = is === undefined ? dataList : dataList.filter(item => item.tag === is);
            const recent = list.filter(item => item.userTagGroup !== undefined || Date.now() - item.editTime < MAX_RECENT_TIME);
            const sorted = recent.sort((a, b) => b.editTime - a.editTime).sort(
                (a, b) => (a.userTagGroup ?? 1023) - (b.userTagGroup ?? 1023)
            );
            const tagged = sorted.filter(item => item.userTagGroup !== undefined).length;
            const next = sorted.slice(0, tagged + MAX_HISTORY_SIZE);
            setLocalDataList(next);
        });
    }, [is]);
    
    useEffect(() => {
        fetchDataStorageList();
    }, [fetchDataStorageList]);

    const listRef = useRef<HTMLDivElement>(null);
    const { width } = useBoundingClientRect(listRef, { width: true });
    const colCount = useMemo(() => Math.floor((width ?? (window.innerWidth * 0.6)) / ITEM_MIN_WIDTH), [width]);

    const handleLoadHistory = useCallback((meta: IDBMeta) => {
        getDataStorageById(meta.id).then(res => {
            onDataLoaded(res.fields, res.dataSource, meta.name, meta.tag!, meta);
            onClose();
        }).catch(onLoadingFailed);
    }, [onClose, onDataLoaded, onLoadingFailed]);

    const handleDeleteHistory = useCallback((id: string) => {
        deleteDataStorageById(id).then(() => {
            fetchDataStorageList();
        });
    }, [fetchDataStorageList]);

    return (
        <List role="grid" ref={listRef} aria-colcount={colCount || 1} style={{ gridTemplateColumns: `repeat(${colCount || 1}, 1fr)` }}>
            {localDataList.map((file, i) => {
                const ext = file.name.endsWith(RathDemoVirtualExt) ? RathDemoVirtualExt : /(?<=\.)[^.]+$/.exec(file.name)?.[0];
                const isRathDemo = ext === RathDemoVirtualExt;
                const name = isRathDemo ? file.name.replace(new RegExp(`\\.${RathDemoVirtualExt.replaceAll(/\./g, '\\.')}$`), '') : file.name;

                return (
                    <ListItem
                        key={i}
                        role="gridcell"
                        aria-rowindex={Math.floor(i / colCount) + 1}
                        aria-colindex={(i % colCount) + 1}
                        tabIndex={0}
                        onClick={() => handleLoadHistory(file)}
                    >
                        <div className="head">
                            <Icon iconName={getFileIcon(isRathDemo ? '' : file.name)} />
                            <div>
                                <header>
                                    <TooltipHost content={name}>
                                        <span>{name}</span>
                                    </TooltipHost>
                                </header>
                                <span>
                                    {`${ext ? `${
                                        isRathDemo ? `Rath ${
                                            intl.get(`dataSource.importData.type.${IDataSourceType.DEMO}`)
                                        }` : ext
                                    } - ` : ''}${formatSize(file.size)}`}
                                </span>
                            </div>
                        </div>
                        <div className="time">
                            <p>{`${intl.get('dataSource.upload.lastOpen')}: ${dayjs(file.editTime).toDate().toLocaleString()}`}</p>
                        </div>
                        <UserTagGroupContainer onClick={e => e.stopPropagation()}>
                            {allUserTagGroups.map(key => {
                                const selected = file.userTagGroup === key;
                                return (
                                    <svg
                                        key={key} aria-selected={selected} className="hover-only"
                                        width={UserTagGroupSize} height={20} viewBox={`-1 -1 ${UserTagGroupSize + 2} 22`}
                                        fill={userTagGroupColors[key]} stroke="none"
                                        onClick={() => {
                                            updateDataStorageUserTagGroup(file.id, selected ? undefined : key);
                                            fetchDataStorageList(false);
                                        }}
                                    >
                                        <path d={`M0,0 h${UserTagGroupSize} v16 l-${UserTagGroupSize / 2},4 l-${UserTagGroupSize / 2},-4 Z`} />
                                    </svg>
                                );
                            })}
                        </UserTagGroupContainer>
                        <IconButton
                            className="hover-only"
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
