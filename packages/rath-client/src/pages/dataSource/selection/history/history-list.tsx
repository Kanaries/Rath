import intl from 'react-intl-universal';
import { observer } from "mobx-react-lite";
import { FC, Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import useBoundingClientRect from "../../../../hooks/use-bounding-client-rect";
import { DataSourceTag, deleteDataStorageById, getDataStorageById, getDataStorageList, IDBMeta } from "../../../../utils/storage";
import type { IMuteFieldBase, IRow } from '../../../../interfaces';
import HistoryListItem from './history-list-item';


const Group = styled.div`
    display: flex;
    flex-direction: column;
    max-width: 680px;
    max-height: 50vh;
    overflow: hidden auto;
    > * {
        flex-grow: 0;
        flex-shrink: 0;
        max-height: unset;
    }
`;

const List = styled.div`
    margin: 1em 0;
    min-height: 8em;
    max-height: 50vh;
    max-width: 680px;
    overflow: hidden auto;
    display: grid;
    gap: 0.4em;
    grid-auto-rows: max-content;
`;

const ITEM_MIN_WIDTH = 200;
const MAX_HISTORY_SIZE = 64;

export enum HistoryRecentTag {
    TODAY = '1d',
    WEEK = '1w',
    MONTH = '1mo',
    THREE_MONTHS = '3mo',
    SIX_MONTHS = '6mo',
    YEAR = '1yr',
}

const limitRecentTime: Record<HistoryRecentTag, number> = {
    [HistoryRecentTag.TODAY]: 1_000 * 60 * 60 * 24,
    [HistoryRecentTag.WEEK]: 1_000 * 60 * 60 * 24 * 7,
    [HistoryRecentTag.MONTH]: 1_000 * 60 * 60 * 24 * 31,
    [HistoryRecentTag.THREE_MONTHS]: 1_000 * 60 * 60 * 24 * 31 * 3,
    [HistoryRecentTag.SIX_MONTHS]: 1_000 * 60 * 60 * 24 * 183,
    [HistoryRecentTag.YEAR]: 1_000 * 60 * 60 * 24 * 366,
};

const MAX_RECENT_TIME = limitRecentTime[HistoryRecentTag.YEAR];

export interface IHistoryListProps {
    onClose: () => void;
    onLoadingFailed: (err: any) => void;
    onDataLoaded: (fields: IMuteFieldBase[], dataSource: IRow[], name: string, tag: DataSourceTag, withHistory: IDBMeta) => void;
    is?: DataSourceTag;
    search?: string;
    /** @default false */
    groupByPeriod?: boolean;
}

const HistoryList: FC<IHistoryListProps> = ({ onDataLoaded, onClose, onLoadingFailed, is, search, groupByPeriod = false }) => {
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

    const list = useMemo(() => {
        if (!search) {
            return localDataList;
        }
        return localDataList.filter(item => {
            let temp = item.name.toLocaleLowerCase();
            for (const keyword of search.toLocaleLowerCase().split(/ +/)) {
                const idx = temp.indexOf(keyword);
                if (idx === -1) {
                    return false;
                }
                temp = temp.slice(idx);
            }
            return true;
        });
    }, [localDataList, search]);

    const groups = useMemo<{ list: typeof list; tag: HistoryRecentTag }[]>(() => {
        if (!groupByPeriod) {
            return [];
        }
        const all = Object.keys(limitRecentTime).map<{ list: typeof list; tag: HistoryRecentTag }>(tag => {
            return {
                list: [],
                tag: tag as HistoryRecentTag,
            };
        });
        const now = Date.now();
        for (const item of list) {
            for (const group of all) {
                if (group.tag === HistoryRecentTag.TODAY) {
                    if (new Date(item.editTime).toDateString() === new Date(now).toDateString()) {
                        group.list.push(item);
                        break;
                    }
                } else if (now - item.editTime < limitRecentTime[group.tag]) {
                    group.list.push(item);
                    break;
                }
            }
        }
        return all.filter(group => group.list.length > 0);
    }, [list, groupByPeriod]);

    return (
        <Group ref={listRef}>
            {groups.length > 0 ? groups.map(group => {
                const beginTime = new Date(group.list.at(-1)!.editTime).toLocaleDateString();
                const endTime = new Date(group.list[0].editTime).toLocaleDateString();
                const period = endTime === beginTime ? endTime : `${beginTime} - ${endTime}`;

                return (
                    <Fragment key={group.tag}>
                        <header>
                            {`${intl.get(`dataSource.upload.history_time.${group.tag}`)}${
                                group.tag === HistoryRecentTag.TODAY ? ''
                                    : ` (${period})`
                            }`}
                        </header>
                        <List role="grid" aria-colcount={colCount || 1} style={{ gridTemplateColumns: `repeat(${colCount || 1}, 1fr)` }}>
                            {group.list.map((file, i) => (
                                <HistoryListItem
                                    key={i}
                                    file={file}
                                    rowIndex={Math.floor(i / colCount) + 1}
                                    colIndex={(i % colCount) + 1}
                                    handleClick={handleLoadHistory}
                                    handleClearClick={handleDeleteHistory}
                                    handleRefresh={() => fetchDataStorageList(false)}
                                />
                            ))}
                        </List>
                    </Fragment>
                );
            }) : (
                <List role="grid" ref={listRef} aria-colcount={colCount || 1} style={{ gridTemplateColumns: `repeat(${colCount || 1}, 1fr)` }}>
                    {list.map((file, i) => (
                        <HistoryListItem
                            key={i}
                            file={file}
                            rowIndex={Math.floor(i / colCount) + 1}
                            colIndex={(i % colCount) + 1}
                            handleClick={handleLoadHistory}
                            handleClearClick={handleDeleteHistory}
                            handleRefresh={() => fetchDataStorageList(false)}
                        />
                    ))}
                </List>
            )}
        </Group>
    );
};

export default observer(HistoryList);
