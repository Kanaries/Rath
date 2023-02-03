import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import { useDashboardContext } from '@store/index';
import { useEffect } from 'react';
import { useBlockConfigs } from '@store/workspace';
import type { IRow } from 'src/interfaces';


const Root = styled.div`
    position: absolute;
    left: 0;
    top: 0;
    cursor: default;
    background-color: var(--page-background);
    box-shadow: 0 0 1rem 0.4rem #888;
    transform-origin: 0 0;
    display: flex;
    overflow: hidden;
`;

export interface DashboardPageProps {
    transform: string;
    data: readonly IRow[];
}

const DashboardPage = observer<DashboardPageProps>(function DashboardPage ({ transform, data }) {
    const block = useBlockConfigs();
    const dashboard = useDashboardContext();
    const { size, items } = dashboard.spec;

    useEffect(() => {
        dashboard.setData(data);
    }, [dashboard, data]);

    const RootLayout = block.layout?.onRender;
    
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
            {RootLayout && <RootLayout data={items} />}
        </Root>
    );
});

export default DashboardPage;
