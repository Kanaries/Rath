import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { FC, useCallback, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { RathColumn, RathDataTable } from '../../components/rath-ui/rath-data-table';
import { Button } from '../../components/ui/button';
import { RathIcon } from '../../components/icons';
import { useGlobalStore } from '../../store';
import DocumentPreview from './document-preview';
import { EditableCell, type DashboardPageItem } from './dashboard-homepage';

const TableContainer = styled.div`
    flex-grow: 1;
    flex-shrink: 1;
    min-height: 0;
    overflow: hidden;
    margin-top: 16px;
`;

const ButtonGroup = styled.div`
    > button {
        margin-block: -6px;
        :hover {
            background-color: #8882;
        }
    }
`;

const PreviewPopup = styled.div`
    pointer-events: none;
    position: fixed;
    transform: translate(-50%, calc(-100% - 4px));
    --bg-color: var(--card);
    background-color: var(--bg-color);
    display: block;
    width: max-content;
    height: max-content;
    filter: drop-shadow(0 1.6px 3.6px rgb(0 0 0 / 26%)) drop-shadow(0 0.3px 0.9px rgb(0 0 0 / 22%));
    ::after {
        position: absolute;
        content: '';
        top: 100%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(45deg);
        --size: 16px;
        width: var(--size);
        height: var(--size);
        background-color: var(--bg-color);
        z-index: -1;
    }
`;

export type FlatDocumentInfo = {
    index: number;
    name: DashboardPageItem['page']['info']['name'];
    description: DashboardPageItem['page']['info']['description'];
    source: DashboardPageItem['page']['data']['source'];
    createTime: DashboardPageItem['page']['info']['createTime'];
    lastModifyTime: DashboardPageItem['page']['info']['lastModifyTime'];
};

export interface DashboardListProps {
    openDocument: (index: number) => void;
    pages: DashboardPageItem[];
}

const DashboardList: FC<DashboardListProps> = ({ openDocument, pages }) => {
    const { dashboardStore } = useGlobalStore();

    const [sortMode, setSortMode] = useState<{
        key: Exclude<keyof FlatDocumentInfo, 'description' | 'index'>;
        direction: 'ascending' | 'descending';
    }>({
        key: 'lastModifyTime',
        direction: 'descending',
    });

    const [previewSource, setPreviewSource] = useState<{
        source: number;
        position: [number, number];
    } | null>(null);

    const items = pages.map<FlatDocumentInfo>(({ page, index }) => ({
        index,
        name: page.info.name,
        source: page.data.source,
        description: page.info.description,
        createTime: page.info.createTime,
        lastModifyTime: page.info.lastModifyTime,
    }));

    const openDocumentRef = useRef(openDocument);
    openDocumentRef.current = openDocument;

    const columns = useMemo<RathColumn<FlatDocumentInfo>[]>(() => {
        return [
            {
                key: 'action',
                name: '',
                minWidth: 64,
                onRender(item) {
                    const { operators } = dashboardStore.fromPage(item['index']);
                    return (
                        <ButtonGroup className="opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Open ${item.name}`}
                                onClick={() => openDocumentRef.current((item as FlatDocumentInfo).index)}
                            >
                                <RathIcon name="BarChartVerticalEdit" />
                            </Button>
                            <Button variant="ghost" size="icon" aria-label={`Duplicate ${item.name}`} onClick={operators.copy}>
                                <RathIcon name="Copy" />
                            </Button>
                            <Button variant="ghost" size="icon" aria-label={`Delete ${item.name}`} onClick={operators.remove}>
                                <RathIcon name="Delete" style={{ color: '#f21044' }} />
                            </Button>
                        </ButtonGroup>
                    );
                },
            },
            {
                key: 'source',
                name: intl.get('common.source'),
                fieldName: 'source',
                minWidth: 100,
                isSortable: true,
                isResizable: true,
                isSorted: sortMode.key === 'source',
                isSortedDescending: sortMode.direction === 'descending',
            },
            {
                key: 'name',
                name: intl.get('common.name'),
                fieldName: 'name',
                minWidth: 180,
                isSortable: true,
                isResizable: true,
                isSorted: sortMode.key === 'name',
                isSortedDescending: sortMode.direction === 'descending',
                onRender(item) {
                    const { operators } = dashboardStore.fromPage(item['index']);
                    return (
                        <EditableCell
                            value={item.name}
                            placeholder="Untitled dashboard"
                            onChange={operators.setName}
                            editLabel={`Edit ${item.name} name`}
                        />
                    );
                },
            },
            {
                key: 'description',
                name: 'Description',
                fieldName: 'description',
                minWidth: 200,
                isResizable: true,
                onRender(item) {
                    const { operators } = dashboardStore.fromPage(item['index']);
                    return (
                        <EditableCell
                            value={item.description}
                            placeholder="Add a description"
                            onChange={operators.setDesc}
                            editLabel={`Edit ${item.name} description`}
                        />
                    );
                },
            },
            {
                key: 'createTime',
                name: 'Created',
                fieldName: 'createTime',
                minWidth: 120,
                maxWidth: 120,
                isSortable: true,
                isSorted: sortMode.key === 'createTime',
                isSortedDescending: sortMode.direction === 'descending',
                onRender(item) {
                    return new Date(item['createTime']).toLocaleString();
                },
            },
            {
                key: 'lastModifyTime',
                name: 'Last updated',
                fieldName: 'lastModifyTime',
                minWidth: 120,
                maxWidth: 120,
                isSortable: true,
                isSorted: sortMode.key === 'lastModifyTime',
                isSortedDescending: sortMode.direction === 'descending',
                onRender(item) {
                    return new Date(item['lastModifyTime']).toLocaleString();
                },
            },
        ];
    }, [sortMode, dashboardStore]);

    const sortedItems = useMemo<typeof items>(() => {
        const flag = sortMode.direction === 'descending' ? -1 : 1;

        return [...items].sort((ar, br) => {
            const a = ar[sortMode.key];
            const b = br[sortMode.key];

            return flag * (typeof a === 'string' ? a.localeCompare(b as string) : a - (b as number));
        });
    }, [items, sortMode]);

    const toggleSort = useCallback(
        (key: typeof sortMode.key) => {
            if (['name', 'source', 'createTime', 'lastModifyTime'].includes(key)) {
                if (key === sortMode.key) {
                    setSortMode({
                        key,
                        direction: sortMode.direction === 'ascending' ? 'descending' : 'ascending',
                    });
                } else {
                    setSortMode({
                        key,
                        direction: sortMode.direction,
                    });
                }
            }
        },
        [sortMode]
    );

    const popupLayout = useMemo(() => {
        if (previewSource) {
            const { position } = previewSource;

            return {
                left: position[0],
                top: position[1],
            };
        }
        return {};
    }, [previewSource]);

    return (
        <>
            <TableContainer>
                <RathDataTable
                    items={sortedItems}
                    columns={columns}
                    getRowKey={(item) => item.index}
                    maxHeight="100%"
                    virtualizationThreshold={40}
                    onScroll={() => setPreviewSource(null)}
                    onColumnHeaderClick={(col) => toggleSort(col.key as typeof sortMode.key)}
                    rowClassName={() => 'group'}
                    onRowClick={(item) => openDocumentRef.current(item.index)}
                    onRowMouseEnter={(item, _index, event) => {
                        const { y } = event.currentTarget.getBoundingClientRect();
                        setPreviewSource({
                            source: item.index,
                            position: [event.clientX, y],
                        });
                    }}
                    onRowMouseLeave={() => setPreviewSource(null)}
                />
            </TableContainer>
            {previewSource &&
                dashboardStore.pages.length > previewSource.source &&
                createPortal(
                    <PreviewPopup style={popupLayout}>
                        <DocumentPreview index={previewSource.source} />
                    </PreviewPopup>,
                    document.body
                )}
        </>
    );
};

export default observer(DashboardList);
