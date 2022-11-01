import { DetailsList, DetailsRow, IColumn, IDetailsRowProps, SelectionMode, Stack } from '@fluentui/react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { FC, useMemo } from 'react';
import styled from 'styled-components';
import { useGlobalStore } from '../../store';
import type { DashboardDocument } from '../../store/dashboardStore';


const PageLayout = styled.div`
    flex-grow: 1;
    flex-shrink: 1;
    height: calc(100vh - 16px);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    > div {
        background-color: #fff;
        margin-inline: 2em;
        padding-block: 1.5em;
        padding-inline: 3em;
        border-radius: 2px;
        box-shadow: 0 1.6px 3.6px 0 rgb(0 0 0 / 13%), 0 0.3px 0.9px 0 rgb(0 0 0 / 11%);
    }
`;

const WorkspaceView = styled.div`
    flex-grow: 0;
    flex-shrink: 0;
    overflow: hidden;
    margin-top: 0.75em;
    margin-bottom: 1em;
    border-bottom: 1px solid #8884;
`;

const DocumentListView = styled.div`
    flex-grow: 1;
    flex-shrink: 1;
    overflow-x: hidden;
    overflow-y: auto;
    margin-bottom: 2em;
`;

const WorkspaceName = styled.div`
    font-size: 17.5px;
    font-weight: 500;
    line-height: 1.6em;
    height: 1.6em;
    margin-block: 0.8em;
`;

const WorkspaceDesc = styled.div`
    font-size: 14px;
    line-height: 1.6em;
    height: 1.6em;
    margin-bottom: 1.5em;
    color: #888;
`;

const CustomRow = styled.div`
    cursor: pointer;
`;

const Row = observer(function Row ({ content, handleClick }: { content: IDetailsRowProps; handleClick: () => void }) {
    return (
        <CustomRow onClick={handleClick}>
            <DetailsRow {...content} />
        </CustomRow>
    );
});

export type FlatDocumentInfo = {
    name: DashboardDocument['info']['name'];
    description: DashboardDocument['info']['description'];
    createTime: DashboardDocument['info']['createTime'];
    lastModifyTime: DashboardDocument['info']['lastModifyTime'];
};

export interface DashboardListProps {
    openDocument: (index: number) => void;
}

const DashboardList: FC<DashboardListProps> = ({ openDocument }) => {
    const { dashboardStore } = useGlobalStore();
    const { name, description, pages } = dashboardStore;

    const columns = useMemo<(IColumn & { key: keyof FlatDocumentInfo; fieldName: keyof FlatDocumentInfo })[]>(() => {
        return [
            {
                key: 'name',
                name: 'name' || intl.get(''),
                fieldName: 'name',
                minWidth: 100,
                isResizable: true,
            },
            {
                key: 'description',
                name: 'description' || intl.get(''),
                fieldName: 'description',
                minWidth: 200,
                isResizable: true,
            },
            {
                key: 'createTime',
                name: 'createTime' || intl.get(''),
                fieldName: 'createTime',
                minWidth: 120,
                maxWidth: 120,
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
                onRender(item) {
                    return new Date(item['lastModifyTime']).toLocaleString();
                },
            },
        ];
    }, []);

    const items = useMemo<FlatDocumentInfo[]>(() => {
        return pages.map(p => ({
            name: p.info.name,
            description: p.info.description,
            createTime: p.info.createTime,
            lastModifyTime: p.info.lastModifyTime,
        }));
    }, [pages]);

    return (
        <PageLayout>
            <WorkspaceView>
                <Stack>
                    <WorkspaceName>
                        <span>{name}</span>
                    </WorkspaceName>
                    <WorkspaceDesc>
                        <span>{description || '(description)'}</span>
                    </WorkspaceDesc>
                </Stack>
            </WorkspaceView>
            <DocumentListView>
                <DetailsList
                    items={items}
                    columns={columns}
                    selectionMode={SelectionMode.none}
                    onRenderRow={props => props ? (
                        <Row
                            content={props}
                            handleClick={() => openDocument(props.itemIndex)}
                        />
                    ) : null}
                />
            </DocumentListView>
        </PageLayout>
    );
};

export default observer(DashboardList);
