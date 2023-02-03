import { memo, useCallback } from 'react';
import styled from 'styled-components';
import ToolPanel from '@components/tool-panel';
import InspectPanel from '@components/inspect-panel';
import TilePanel from '@components/tile-panel';
import { useDashboardContextProvider } from '@store';
import { useWorkspaceContextProvider } from '@store/workspace';
import type { DashboardSpecification, DashboardEventHandler, IRow } from './interfaces';
import K6sDashboard from './main';


const Root = styled.div`
    width: 100%;
    height: 100%;
    flex-grow: 1;
    flex-shrink: 1;
    flex-basis: 0%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
`;

const Container = styled.div`
    flex-grow: 1;
    flex-shrink: 1;
    display: flex;
    flex-direction: row;
    overflow: hidden;
    border-bottom: 1px solid #aaa;
`;

export interface K6sDashboardEditorProps {
    data?: readonly IRow[];
    dashboard: DashboardSpecification;
}

const K6sDashboardEditor = memo<K6sDashboardEditorProps>(function K6sDashboardEditor ({ data = [], dashboard }) {
    const DashboardCtxProvider = useDashboardContextProvider(dashboard);
    const WorkspaceCtxProvider = useWorkspaceContextProvider();

    const handler = useCallback<DashboardEventHandler>(ev => {
        // do sth
    }, []);

    return (
        <WorkspaceCtxProvider>
            <DashboardCtxProvider>
                <Root>
                    <ToolPanel />
                    <Container>
                        <TilePanel />
                        <K6sDashboard dashboard={dashboard} data={data} handler={handler} />
                        <InspectPanel />
                    </Container>
                </Root>
            </DashboardCtxProvider>
        </WorkspaceCtxProvider>
    );
});


export default K6sDashboardEditor;
export const DashboardEditor = K6sDashboardEditor;
