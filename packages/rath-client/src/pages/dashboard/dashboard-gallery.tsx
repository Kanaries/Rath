import { observer } from 'mobx-react-lite';
import type { FC } from 'react';
import styled from 'styled-components';
import { RathIcon } from '../../components/icons';
import DashboardRenderer from './renderer';
import type { DashboardPageItem } from './dashboard-homepage';

const Container = styled.div`
    width: 100%;
    min-height: 0;
    margin-top: 16px;
    padding: 4px;
    overflow: hidden auto;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    align-content: start;
    gap: 12px;
`;

const Preview = styled.button`
    cursor: pointer;
    background-color: var(--card);
    padding: 12px;
    min-width: 0;
    color: var(--foreground);
    border: 1px solid var(--border);
    border-radius: 9px;
    display: flex;
    flex-direction: column;
    text-align: left;
    transition: border-color 120ms ease, box-shadow 120ms ease, transform 120ms ease;

    :hover {
        border-color: var(--ring);
        box-shadow: 0 4px 12px rgb(0 0 0 / 10%);
        transform: translateY(-1px);
    }

    :focus-visible {
        outline: 2px solid var(--ring);
        outline-offset: 2px;
    }

    > span {
        flex-grow: 0;
        flex-shrink: 0;
        width: 100%;
        line-height: 1.5em;
        height: 1.5em;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    > span {
        color: var(--muted-foreground);
        font-size: 12px;
    }
    > div {
        pointer-events: none;
    }
`;

const PreviewTitle = styled.span`
    color: var(--foreground);
    font-size: 14px;
    font-weight: 600;
`;

const PreviewMeta = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 2px;
    color: var(--muted-foreground);
    font-size: 12px;
`;

export interface DashboardGalleryProps {
    openDocument: (index: number) => void;
    pages: DashboardPageItem[];
}

const PREVIEW_WIDTH = 240;

const DashboardGallery: FC<DashboardGalleryProps> = ({ openDocument, pages }) => {
    return (
        <Container>
            {pages.map(({ page, index }) => (
                <Preview key={index} type="button" aria-label={`Open ${page.info.name}`} onClick={() => openDocument(index)}>
                    <PreviewTitle title={page.info.name}>{page.info.name}</PreviewTitle>
                    <span title={page.info.description}>{page.info.description || 'No description'}</span>
                    <PreviewMeta>
                        <RathIcon name="Database" size={13} />
                        <span title={page.data.source}>{page.data.source}</span>
                    </PreviewMeta>
                    <DashboardRenderer
                        page={page}
                        renderRatio={PREVIEW_WIDTH / page.config.size.w}
                        dataLimit={2 ** 9 / Math.max(pages.length, 1)}
                        style={{
                            margin: '8px 0 0',
                        }}
                    />
                </Preview>
            ))}
        </Container>
    );
};

export default observer(DashboardGallery);
