import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { FC, useCallback, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { RathColumn, RathDataTable } from '../../components/rath-ui/rath-data-table';
import { Button } from '../../components/ui/button';
import { RathIcon } from '../../components/icons';
import { useGlobalStore } from '../../store';
import type { DashboardDocument } from '../../store/dashboardStore';
import DocumentPreview from './document-preview';
import { EditableCell } from './dashboard-homepage';

const TableContainer = styled.div`
    flex-grow: 1;
    flex-shrink: 1;
    min-height: 0;
    overflow: hidden;
    margin-block: 1em;
    padding-bottom: 1em;
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
    name: DashboardDocument['info']['name'];
    description: DashboardDocument['info']['description'];
    source: DashboardDocument['data']['source'];
    createTime: DashboardDocument['info']['createTime'];
    lastModifyTime: DashboardDocument['info']['lastModifyTime'];
};

export interface DashboardListProps {
    openDocument: (index: number) => void;
    pages: DashboardDocument[];
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

    const items = useMemo(
        () =>
            pages.map<FlatDocumentInfo>((p, i) => ({
                index: i,
                name: p.info.name,
                source: p.data.source,
                description: p.info.description,
                createTime: p.info.createTime,
                lastModifyTime: p.info.lastModifyTime,
            })),
        [pages]
    );

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
                                aria-label="Edit"
                                onClick={() => openDocumentRef.current((item as FlatDocumentInfo).index)}
                            >
                                <RathIcon name="BarChartVerticalEdit" />
                            </Button>
                            <Button variant="ghost" size="icon" aria-label="Copy" onClick={operators.copy}>
                                <RathIcon name="Copy" />
                            </Button>
                            <Button variant="ghost" size="icon" aria-label="Delete" onClick={operators.remove}>
                                <RathIcon name="Delete" style={{ color: '#f21044' }} />
                            </Button>
                        </ButtonGroup>
                    );
                },
            },
            {
                key: 'source',
                name: 'source' || intl.get(''),
                fieldName: 'source',
                minWidth: 100,
                isSortable: true,
                isResizable: true,
                isSorted: sortMode.key === 'source',
                isSortedDescending: sortMode.direction === 'descending',
            },
            {
                key: 'name',
                name: 'name' || intl.get(''),
                fieldName: 'name',
                minWidth: 180,
                isSortable: true,
                isResizable: true,
                isSorted: sortMode.key === 'name',
                isSortedDescending: sortMode.direction === 'descending',
                onRender(item) {
                    const { operators } = dashboardStore.fromPage(item['index']);
                    return <EditableCell value={item['name']} placeholder="(name)" onChange={operators.setName} />;
                },
            },
            {
                key: 'description',
                name: 'description' || intl.get(''),
                fieldName: 'description',
                minWidth: 200,
                isResizable: true,
                onRender(item) {
                    const { operators } = dashboardStore.fromPage(item['index']);
                    return <EditableCell value={item['description']} placeholder="(description)" onChange={operators.setDesc} />;
                },
            },
            {
                key: 'createTime',
                name: 'createTime' || intl.get(''),
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
                name: 'lastModifyTime' || intl.get(''),
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

        return items.sort((ar, br) => {
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
                pages.length > previewSource.source &&
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
