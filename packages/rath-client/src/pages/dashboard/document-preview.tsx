import { observer } from 'mobx-react-lite';
import type { FC } from 'react';
import styled from 'styled-components';
import { useGlobalStore } from '../../store';
import DashboardRenderer from './renderer';

const Preview = styled.div`
    display: flex;
    width: max-content;
    height: max-content;
    overflow: hidden;
    padding: 0;
`;

const DocumentPreview: FC<{ index: number }> = ({ index }) => {
    const { dashboardStore } = useGlobalStore();
    const { pages } = dashboardStore;
    const page = pages[index];

    return (
        <Preview>
            <DashboardRenderer
                page={page}
                renderRatio={1.25}
                dataLimit={2 ** 9}
                style={{
                    margin: 0,
                }}
            />
        </Preview>
    );
};

export default observer(DocumentPreview);
