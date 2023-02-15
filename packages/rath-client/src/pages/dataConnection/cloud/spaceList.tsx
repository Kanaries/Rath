import intl from 'react-intl-universal';
import styled from 'styled-components';
import { useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { observer } from "mobx-react-lite";
import { DefaultButton, Icon, Spinner, TooltipHost } from '@fluentui/react';
import { useGlobalStore } from '../../../store';
import useBoundingClientRect from '../../../hooks/use-bounding-client-rect';
import { formatSize } from '../history/history-list-item';
import type { INotebook, IWorkspace } from '../../../store/userStore';
import type { IDatasetMeta } from '../../../interfaces';


const List = styled.div`
    margin: 0.4em 0 1em;
    height: 26em;
    width: 100%;
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
    padding: 0.4em 1em 1em 1.4em;
    border-radius: 4px;
    position: relative;
    box-shadow: inset 0 0 2px #8881;
    > .head {
        display: flex;
        align-items: center;
        > i {
            flex-grow: 0;
            flex-shrink: 0;
            font-size: 2rem;;
            margin-right: 0.5em;
            user-select: none;
        }
        > header {
            flex-grow: 1;
            flex-shrink: 1;
            overflow: hidden;
            font-size: 0.8rem;
            line-height: 1.5em;
            font-weight: 550;
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
            color: #111;
        }
    }
    .time, .size {
        font-size: 0.5rem;
        color: #888;
    }
    :hover {
        background-color: #8881;
    }
    cursor: pointer;
    &[aria-disabled="true"] {
        pointer-events: none;
        opacity: 0.6;
    }
`;

const ITEM_MIN_WIDTH = 240;

export enum CloudItemType {
    NOTEBOOK = 'notebook',
    DATASET = 'dataset',
}

export interface ICloudSpaceList {
    loading: boolean;
    filter: CloudItemType | 'total';
    setLoadingAnimation: (value: boolean) => void;
    workspace: IWorkspace | undefined;
    reload: () => void;
}

const NotebookItem = observer<{ notebook: INotebook; index: number; colCount: number; busy: boolean; onClick: () => void }>(({
    notebook, index, colCount, busy, onClick,
}) => {
    return (
        <ListItem
            role="gridcell"
            aria-rowindex={Math.floor(index / colCount) + 1}
            aria-colindex={(index % colCount) + 1}
            aria-disabled={busy}
            onClick={() => {
                if (busy) {
                    return;
                }
                onClick();
            }}
        >
            <div className="head" role="button" tabIndex={0}>
                <Icon iconName="Inbox" />
                <header>
                    <TooltipHost content={notebook.name}>
                        <span>{notebook.name}</span>
                    </TooltipHost>
                </header>
            </div>
            <div className="time">
                <p>{`${intl.get('storage.createdAt')}: ${dayjs(notebook.createAt * 1_000).toDate().toLocaleString()}`}</p>
            </div>
            <div className="size">
                <p>{`${intl.get('storage.size')}: ${formatSize(notebook.size / 1_000)}`}</p>
            </div>
        </ListItem>
    );
});

const DatasetItem = observer<{ dataset: IDatasetMeta; index: number; colCount: number; busy: boolean; onClick: () => void }>(({
    dataset, index, colCount, busy, onClick,
}) => {
    return (
        <ListItem
            key={index}
            role="gridcell"
            aria-rowindex={Math.floor(index / colCount) + 1}
            aria-colindex={(index % colCount) + 1}
            aria-disabled={busy}
            onClick={() => {
                if (busy) {
                    return;
                }
                onClick();
            }}
        >
            <div className="head" role="button" tabIndex={0}>
                <Icon iconName="Package" />
                <header>
                    <TooltipHost content={dataset.name}>
                        <span>{dataset.name}</span>
                    </TooltipHost>
                </header>
            </div>
            <div className="time">
                <p>{`${intl.get('storage.createdAt')}: ${dayjs(dataset.createAt * 1_000).toDate().toLocaleString()}`}</p>
            </div>
            <div className="size">
                <p>{`${intl.get('storage.size')}: ${formatSize(dataset.size / 1_000)}`}</p>
            </div>
        </ListItem>
    );
});

const CloudSpaceList = observer<ICloudSpaceList>(function CloudSpaceList ({
    filter, setLoadingAnimation, workspace, reload, loading,
}) {
    const { userStore } = useGlobalStore();
    const [busy, setBusy] = useState(false);

    const list = (workspace?.notebooks ?? []).map<{
        type: CloudItemType.NOTEBOOK;
        notebook: INotebook;
    } | {
        type: CloudItemType.DATASET;
        dataset: IDatasetMeta;
    }>(notebook => ({
        type: CloudItemType.NOTEBOOK,
        notebook,
    })).concat((workspace?.datasets ?? []).map(dataset => ({
        type: CloudItemType.DATASET,
        dataset,
    }))).filter(item => filter === 'total' || item.type === filter);
    
    const listRef = useRef<HTMLDivElement>(null);
    const { width } = useBoundingClientRect(listRef, { width: true });

    const colCount = useMemo(() => Math.floor((width ?? (window.innerWidth * 0.6)) / ITEM_MIN_WIDTH), [width]);

    if (loading) {
        return (
            <div className="list">
                <Spinner />
            </div>
        );
    }

    if (!workspace) {
        return null;
    }

    return (
        <div className="list">
            {loading && (
                <Spinner />
            )}
            <List role="grid" ref={listRef} aria-colcount={colCount || 1} style={{ gridTemplateColumns: `repeat(${colCount || 1}, 1fr)` }}>
                {!loading && list.map((item, i) => {
                    if (item.type === CloudItemType.NOTEBOOK) {
                        const { notebook } = item;
                        return (
                            <NotebookItem
                                key={i}
                                index={i}
                                colCount={colCount}
                                busy={busy}
                                notebook={notebook}
                                onClick={() => {
                                    setBusy(true);
                                    setLoadingAnimation(true);
                                    userStore.openNotebook(notebook.downLoadURL).finally(() => {
                                        setBusy(false);
                                        setLoadingAnimation(false);
                                    });
                                }}
                            />
                        );
                    } else if (item.type === CloudItemType.DATASET) {
                        const { dataset } = item;
                        return (
                            <DatasetItem
                                key={i}
                                index={i}
                                colCount={colCount}
                                busy={busy}
                                dataset={dataset}
                                onClick={() => {
                                    setBusy(true);
                                    setLoadingAnimation(true);
                                    userStore.openDataset(dataset).finally(() => {
                                        setBusy(false);
                                        setLoadingAnimation(false);
                                    });
                                }}
                            />
                        );
                    }
                    return null;
                })}
            </List>
            <DefaultButton
                text={intl.get('storage.refresh')}
                disabled={loading}
                onClick={() => reload()}
            />
        </div>
    );
});


export default CloudSpaceList;
