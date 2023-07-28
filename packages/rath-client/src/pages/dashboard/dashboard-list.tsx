import { DetailsList, DetailsRow, IColumn, IconButton, IDetailsRowProps, Layer, SelectionMode } from '@fluentui/react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { FC, useCallback, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { useGlobalStore } from '../../store';
import type { DashboardDocument } from '../../store/dashboardStore';
import DocumentPreview from './document-preview';
import { EditableCell } from './dashboard-homepage';


const TableContainer = styled.div`
    flex-grow: 1;
    flex-shrink: 1;
    overflow: hidden;
    overflow-y: auto;
    margin-block: 1em;
    padding-bottom: 1em;
`;

const CustomRow = styled.div`
    .button-group {
        opacity: 0;
    }
    :hover .button-group {
        opacity: 1;
    }
    position: relative;
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
    --bg-color: #fff;
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

const Row = observer(function Row({
    content,
    handleMouseOn,
    handleMouseOut,
}: {
    content: IDetailsRowProps;
    handleMouseOn: (x: number, y: number) => void;
    handleMouseOut: () => void;
}) {
    return (
        <CustomRow
            onMouseEnter={(e) => {
                const { y } = (e.target as HTMLDivElement).getBoundingClientRect();
                handleMouseOn(e.clientX, y);
            }}
            onMouseLeave={handleMouseOut}
        >
            <DetailsRow {...content} />
        </CustomRow>
    );
});

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

    const items = useMemo(() => pages.map<FlatDocumentInfo>((p, i) => ({
        index: i,
        name: p.info.name,
        source: p.data.source,
        description: p.info.description,
        createTime: p.info.createTime,
        lastModifyTime: p.info.lastModifyTime,
    })), [pages]);

    const openDocumentRef = useRef(openDocument);
    openDocumentRef.current = openDocument;

    const columns = useMemo<(IColumn & { key: keyof FlatDocumentInfo | 'action'; fieldName?: keyof FlatDocumentInfo })[]>(() => {
        return [
            {
                key: 'action',
                name: '',
                minWidth: 64,
                onRender(item) {
                    const { operators } = dashboardStore.fromPage(item['index']);
                    return (
                        <ButtonGroup className="button-group" onClick={(e) => e.stopPropagation()}>
                            <IconButton iconProps={{ iconName: 'BarChartVerticalEdit' }} onClick={() => openDocumentRef.current((item as FlatDocumentInfo).index)} />
                            <IconButton iconProps={{ iconName: 'Copy' }} onClick={operators.copy} />
                            {/* <IconButton iconProps={{ iconName: 'Download' }} onClick={operators.download} /> */}
                            <IconButton iconProps={{ iconName: 'Delete', style: { color: '#f21044' } }} onClick={operators.remove} />
                        </ButtonGroup>
                    );
                },
            },
            {
                key: 'source',
                name: 'source' || intl.get(''),
                fieldName: 'source',
                minWidth: 100,
                isResizable: true,
                isSorted: sortMode.key === 'source',
                isSortedDescending: sortMode.direction === 'descending',
            },
            {
                key: 'name',
                name: 'name' || intl.get(''),
                fieldName: 'name',
                minWidth: 180,
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
            <TableContainer onScroll={() => setPreviewSource(null)}>
                <DetailsList
                    items={sortedItems}
                    columns={columns}
                    onColumnHeaderClick={(_, col) => col && toggleSort(col.key as typeof sortMode.key)}
                    selectionMode={SelectionMode.none}
                    onRenderRow={props => {
                        if (props) {
                            return (
                                <Row
                                    content={props}
                                    handleMouseOn={(x, y) =>
                                        setPreviewSource({
                                            source: (props.item as FlatDocumentInfo).index,
                                            position: [x, y],
                                        })
                                    }
                                    handleMouseOut={() => setPreviewSource(null)}
                                />
                            );
                        }
                        return null;
                    }}
                />
            </TableContainer>
            <Layer>
                {previewSource && pages.length > previewSource.source && (
                    <PreviewPopup style={popupLayout}>
                        <DocumentPreview index={previewSource.source} />
                    </PreviewPopup>
                )}
            </Layer>
        </>
    );
};

export default observer(DashboardList);
