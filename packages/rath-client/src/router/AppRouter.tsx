import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { HashRouter, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useGlobalStore } from '../store';
import { PIVOT_KEYS } from '../constants';
import { applyInitialNavigation } from '../utils/navigation';
import { isPivotKey, readRouteKeyFromHash, setRouterNavigate } from './routerBridge';
import VisualInterface from '../pages/manualControl';
import DataSourceBoard from '../pages/dataSource/index';
import PatternPage from '../pages/semiAutomation/index';
import LTSPage from '../pages/megaAutomation';
import ProgressiveDashboard from '../pages/progressiveDashboard';
import Painter from '../pages/painter';
import Collection from '../pages/collection';
import Dashboard from '../pages/dashboard';
import CausalPage from '../pages/causal';
import DataConnection from '../pages/dataConnection';
import CrInfo from '../components/crInfo';

const ROUTE_COMPONENTS: Record<string, JSX.Element> = {
    [PIVOT_KEYS.connection]: <DataConnection />,
    [PIVOT_KEYS.dataSource]: <DataSourceBoard />,
    [PIVOT_KEYS.editor]: <VisualInterface />,
    [PIVOT_KEYS.megaAuto]: <LTSPage />,
    [PIVOT_KEYS.semiAuto]: <PatternPage />,
    [PIVOT_KEYS.painter]: <Painter />,
    [PIVOT_KEYS.dashBoardDesigner]: <ProgressiveDashboard />,
    [PIVOT_KEYS.collection]: <Collection />,
    [PIVOT_KEYS.dashboard]: <Dashboard />,
    [PIVOT_KEYS.causal]: <CausalPage />,
};

const RouterSync = observer(function RouterSync() {
    const navigate = useNavigate();
    const location = useLocation();
    const { commonStore, workflowStore } = useGlobalStore();

    useEffect(() => {
        setRouterNavigate(navigate);
        return () => setRouterNavigate(null);
    }, [navigate]);

    useEffect(() => {
        applyInitialNavigation({
            setAppKey: (key, options) => commonStore.setAppKey(key, options),
            setAutopilotHandoff: (handoff) => workflowStore.setAutopilotHandoff(handoff),
            setCausalHandoff: (handoff) => workflowStore.setCausalHandoff(handoff),
            setEffectEstimate: (handoff) => workflowStore.setEffectEstimate(handoff),
        });

        const legacyKey = readRouteKeyFromHash();
        if (legacyKey && (location.pathname === '/' || location.pathname === '')) {
            navigate(`/${legacyKey}`, { replace: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const routeKey = location.pathname.replace(/^\//, '');
        if (isPivotKey(routeKey) && routeKey !== commonStore.appKey) {
            commonStore.setAppKey(routeKey, { syncHash: false });
        }
    }, [location.pathname, commonStore]);

    return null;
});

const RoutedPage = observer(function RoutedPage() {
    const { appKey = PIVOT_KEYS.connection } = useParams<{ appKey: string }>();
    const { commonStore } = useGlobalStore();
    const key = isPivotKey(appKey) ? appKey : commonStore.appKey;
    return (
        <>
            {ROUTE_COMPONENTS[key] ?? ROUTE_COMPONENTS[PIVOT_KEYS.connection]}
            <CrInfo />
        </>
    );
});

export default function AppRouter() {
    return (
        <HashRouter>
            <RouterSync />
            <Routes>
                <Route path="/" element={<Navigate to={`/${PIVOT_KEYS.connection}`} replace />} />
                <Route path="/:appKey" element={<RoutedPage />} />
            </Routes>
        </HashRouter>
    );
}
