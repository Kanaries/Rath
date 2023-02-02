import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import { useDashboardContext } from '@store/index';
import { useEffect } from 'react';
import type { IRow } from 'src/interfaces';
import LayoutBlock from './block/layout-block';


const Root = styled.div`
    position: absolute;
    left: 0;
    top: 0;
    cursor: default;
    background-color: var(--page-background);
    box-shadow: 0 0 1rem 0.4rem #888;
    transform-origin: 0 0;
    display: flex;
    align-items: stretch;
    justify-content: stretch;
`;

export interface DashboardPageProps {
    transform: string;
    data: readonly IRow[];
}

const DashboardPage = observer<DashboardPageProps>(function DashboardPage ({ transform, data }) {
    const dashboard = useDashboardContext();
    const { size, items } = dashboard.spec;

    useEffect(() => {
        dashboard.setData(data);
    }, [dashboard, data]);
    
    return (
        <Root
            style={{
                transform,
                width: `${size.width}px`,
                height: `${size.height}px`,
                padding: `${size.padding}px`,
                // @ts-expect-error css variable
                '--spacing': `${size.spacing}px`,
                ...dashboard.theme
            }}
        >
            <LayoutBlock data={items} />
        </Root>
    );
});

export default DashboardPage;
