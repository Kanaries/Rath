import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Spinner, SpinnerSize } from '@fluentui/react';
import './normalize.css';
import './App.css';
import { useGlobalStore, StoreWrapper } from './store/index';
import VisualInterface from './pages/manualControl';
import DataSourceBoard from './pages/dataSource/index';
import PatternPage from './pages/semiAutomation/index';
import LTSPage from './pages/megaAutomation';
import AppNav from './components/appNav';
import { destroyRathWorker, initRathWorker } from './services/index';
import { PIVOT_KEYS } from './constants';
import CrInfo from './components/crInfo';
import ProgressiveDashboard from './pages/progressiveDashboard';
import Painter from './pages/painter';
import Collection from './pages/collection';
import Dashboard from './pages/dashboard';
import CausalPage from './pages/causal';
import PerformanceWindow from './components/performance-window';
import useHotKey from './hooks/use-hotkey';
import DataConnection from './pages/dataConnection';


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
        'Control+Shift+P': () => setShowPerformanceWindow(on => !on),
    });

    if (!langStore.loaded) {
        return (
            <div style={{ marginTop: '6em' }}>
                <Spinner label="Initializing Rath..." size={SpinnerSize.large} />
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
