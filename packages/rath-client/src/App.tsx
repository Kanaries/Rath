import { Suspense, lazy, useEffect, useState, type JSX } from 'react';
import { observer } from 'mobx-react-lite';
import { useGlobalStore, StoreWrapper } from './store/index';
import AppNav from './components/appNav';
import { destroyRathWorker, initRathWorker } from './services/index';
import { PIVOT_KEYS } from './constants';
import CrInfo from './components/crInfo';
import PerformanceWindow from './components/performance-window';
import useHotKey from './hooks/use-hotkey';
import useErrorBoundary from './hooks/use-error-boundary';
import { Button } from './components/ui/button';
import { Spinner } from './components/ui/spinner';
import { SidebarInset, SidebarProvider, SidebarTrigger } from './components/ui/sidebar';

const loadVisualInterface = () => import('./pages/manualControl');
const VisualInterface = lazy(loadVisualInterface);
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
    const { langStore, commonStore, dataSourceStore } = useGlobalStore();
    const { appKey, navMode } = commonStore;
    const canAnalyze = dataSourceStore.satisfyAnalysisCondition;

    const LazyPageBoundary = useErrorBoundary(
        () => (
            <div role="alert" className="m-6 rounded-lg border border-destructive/40 bg-destructive/5 px-6 py-10 text-center">
                <h1 className="text-base font-medium">Unable to load this page</h1>
                <p className="mt-2 text-sm text-muted-foreground">The page bundle failed to load. Reload Rath and try again.</p>
                <Button className="mt-4" onClick={() => window.location.reload()}>
                    Reload Rath
                </Button>
            </div>
        ),
        [appKey]
    );

    useEffect(() => {
        initRathWorker(commonStore.computationEngine);
        return () => {
            destroyRathWorker();
        };
    }, [commonStore]);

    useEffect(() => {
        if (!canAnalyze) return;
        const timer = window.setTimeout(() => {
            void loadVisualInterface().catch(() => {
                // React.lazy will surface the failure through the page boundary
                // if the user opens Exploration.
            });
        }, 250);
        return () => window.clearTimeout(timer);
    }, [canAnalyze]);

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
            <SidebarProvider
                className="main-app-container"
                open={navMode === 'text'}
                onOpenChange={(open) => commonStore.setNavMode(open ? 'text' : 'icon')}
            >
                <AppNav />
                <SidebarInset className="main-app-content">
                    <SidebarTrigger className="fixed left-2 top-2 z-40 border bg-background shadow-xs md:hidden" />
                    <LazyPageBoundary>
                        <Suspense
                            fallback={
                                <div role="status" className="flex items-center justify-center gap-2 p-8">
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
                    </LazyPageBoundary>
                    <CrInfo />
                </SidebarInset>
            </SidebarProvider>
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
