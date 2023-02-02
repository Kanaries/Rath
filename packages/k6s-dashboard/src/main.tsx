import { memo, useCallback, useState } from 'react';
import styled from 'styled-components';
import QuickPinchZoom, { make3dTransformValue, UpdateAction } from 'react-quick-pinch-zoom';
import DashboardPage from '@components/dashboard-page';
import type { DashboardSpecification, DashboardEventHandler, IRow } from './interfaces';
import { useDashboardContext, useDashboardContextProvider } from './store';


const Root = styled.div`
    width: 100%;
    height: 100%;
    flex-grow: 1;
    flex-shrink: 1;
    flex-basis: 0%;
    overflow: hidden;
    background-color: #aaa;
    cursor: grab;
    position: relative;
`;

export interface K6sDashboardProps {
    dashboard: DashboardSpecification;
    data?: readonly IRow[];
    handler?: DashboardEventHandler;
}

const K6sDashboard = memo<K6sDashboardProps>(function K6sDashboard ({ dashboard, data = [] }) {
    const Provider = useDashboardContextProvider(dashboard);
    const context = useDashboardContext();
    const [transform, setTransform] = useState<string>('');

    const handleZoom = useCallback(({ x, y, scale }: UpdateAction) => {
        setTransform(make3dTransformValue({ x, y, scale }));
    }, []);

    return (
        <Provider>
            <Root onClick={() => context.clearSelections()}>
                <QuickPinchZoom
                    onUpdate={handleZoom}
                    doubleTapZoomOutOnMaxScale
                    animationDuration={1}
                    inertiaFriction={0.2}
                    zoomOutFactor={0}
                    minZoom={0.2}
                    maxZoom={2}
                    horizontalPadding={window.innerWidth * 0.08}
                    verticalPadding={window.innerHeight * 0.08}
                    containerProps={{ style: { position: 'relative', width: '100%', height: '100%', overflow: 'hidden' } }}
                >
                    <DashboardPage transform={transform} data={data} />
                </QuickPinchZoom>
            </Root>
        </Provider>
    );
});


export default K6sDashboard;
export const Dashboard = K6sDashboard;
