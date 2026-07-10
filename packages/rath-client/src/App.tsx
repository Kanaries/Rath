import { Suspense, lazy, useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import './normalize.css';
import './App.css';
import { useGlobalStore, StoreWrapper } from './store/index';
import AppNav from './components/appNav';
import { destroyRathWorker, initRathWorker } from './services/index';
import { PIVOT_KEYS } from './constants';
import CrInfo from './components/crInfo';
import PerformanceWindow from './components/performance-window';
import useHotKey from './hooks/use-hotkey';
import { Spinner } from './components/ui/spinner';

const VisualInterface = lazy(() => import('./pages/manualControl'));
const DataSourceBoard = lazy(() => import('./pages/dataSource/index'));
const PatternPage = lazy(() => import('./pages/semiAutomation/index'));
const LTSPage = lazy(() => import('./pages/megaAutomation'));
const ProgressiveDashboard = lazy(() => import('./pages/progressiveDashboard'));
const Painter = lazy(() => import('./pages/painter'));
const Collection = lazy(() => import('./pages/collection'));
const Dashboard = lazy(() => import('./pages/dashboard'));
const CausalPage = lazy(() => import('./pages/causal'));
const DataConnection = lazy(() => import('./pages/dataConnection'));

function App() {
    const { langStore, commonStore } = useGlobalStore();
    const { appKey, navMode } = commonStore;

    useEffect(() => {
        initRathWorker(commonStore.computationEngine);
        return () => {
            destroyRathWorker();
        };
    }, [commonStore]);

    const [showPerformanceWindow, setShowPerformanceWindow] = useState(false);
    useHotKey({
        'Control+Shift+P': () => setShowPerformanceWindow((on) => !on),
    });

    if (!langStore.loaded) {
        return (
            <div style={{ marginTop: '6em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Spinner className="h-5 w-5" />
                <span>Initializing Rath...</span>
            </div>
        );
    }

    return (
        <div>
            <div className="main-app-container">
                <div className="main-app-nav" style={{ flexBasis: navMode === 'text' ? '220px' : '3px' }}>
                    <AppNav />
                </div>
                <div className="main-app-content">
                    <Suspense
                        fallback={
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '2em' }}>
                                <Spinner className="h-5 w-5" />
                                <span>Loading...</span>
                            </div>
                        }
                    >
                        {appKey === PIVOT_KEYS.dataSource && <DataSourceBoard />}
                        {appKey === PIVOT_KEYS.editor && <VisualInterface />}
                        {appKey === PIVOT_KEYS.megaAuto && <LTSPage />}
                        {appKey === PIVOT_KEYS.semiAuto && <PatternPage />}
                        {appKey === PIVOT_KEYS.painter && <Painter />}
                        {appKey === PIVOT_KEYS.dashBoardDesigner && <ProgressiveDashboard />}
                        {appKey === PIVOT_KEYS.collection && <Collection />}
                        {appKey === PIVOT_KEYS.dashboard && <Dashboard />}
                        {appKey === PIVOT_KEYS.causal && <CausalPage />}
                        {appKey === PIVOT_KEYS.connection && <DataConnection />}
                    </Suspense>
                    <CrInfo />
                </div>
            </div>
            {showPerformanceWindow && <PerformanceWindow />}
        </div>
    );
}

const OBApp = observer(App);

export default function WrappedApp(): JSX.Element {
    return (
        <StoreWrapper>
            <OBApp />
        </StoreWrapper>
    );
}
