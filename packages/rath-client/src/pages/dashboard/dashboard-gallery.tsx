import { observer } from 'mobx-react-lite';
import type { FC } from 'react';
import styled from 'styled-components';
import type { DashboardDocument } from '../../store/dashboardStore';
import DashboardRenderer from './renderer';

const Container = styled.div`
    width: 100%;
    overflow: hidden auto;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    background-color: #f8f8f8;
    > * {
        flex-grow: 0;
        flex-shrink: 0;
        margin: 6px;
    }
`;

const Preview = styled.div`
    cursor: pointer;
    background-color: #fff;
    padding: 10px;
    width: 260px;
    display: flex;
    flex-direction: column;
    > header,
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
        opacity: 0.8;
        font-size: 80%;
    }
    > div {
        pointer-events: none;
    }
`;

export interface DashboardGalleryProps {
    openDocument: (index: number) => void;
    pages: DashboardDocument[];
}

const PREVIEW_WIDTH = 240;

const DashboardGallery: FC<DashboardGalleryProps> = ({ openDocument, pages }) => {
    return (
        <Container>
            {pages.map((page, i) => (
                <Preview key={i} onClick={() => openDocument(i)}>
                    <header title={page.info.name}>{page.info.name}</header>
                    <span title={page.info.description}>{page.info.description}</span>
                    <DashboardRenderer
                        page={page}
                        renderRatio={PREVIEW_WIDTH / page.config.size.w}
                        dataLimit={2 ** 9 / pages.length}
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
