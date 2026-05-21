import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Spinner, SpinnerSize } from '@fluentui/react';
import './normalize.css';
import './App.css';
import { useGlobalStore, StoreWrapper } from './store/index';
import AppNav from './components/appNav';
import { destroyRathWorker, initRathWorker } from './services/index';
import PerformanceWindow from './components/performance-window';
import useHotKey from './hooks/use-hotkey';
import AppRouter from './router/AppRouter';

function App() {
    const { langStore, commonStore } = useGlobalStore();
    const { navMode } = commonStore;

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
                    <AppRouter />
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
