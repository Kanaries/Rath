import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Spinner, SpinnerSize } from '@fluentui/react';
import './App.css';
import { useGlobalStore, StoreWrapper } from './store/index';
import VisualInterface from './pages/manualControl';
import DataSourceBoard from './pages/dataSource/index';
import PatternPage from './pages/semiAutomation/index';
import SupportPage from './pages/support/index';
import LTSPage from './pages/megaAutomation';
import MessageSegment from './components/messageSegment';
import AppNav from './components/appNav';
import { destroyRathWorker, initRathWorker } from './services/index';
import { PIVOT_KEYS } from './constants';
import CrInfo from './components/crInfo';
import ProgressiveDashboard from './pages/progressiveDashboard';
import Painter from './pages/painter';
import Collection from './pages/collection';
import Dashboard from './pages/dashboard';
import CausalPage from './pages/causal';
import PreferencePage from './pages/preference';
import { diffJSON, getItem, getPreferencesSchema, loadPreferences, savePreferences, toJSONValues } from './pages/preference/utils';
import PerformanceWindow from './components/performance-window';
import useHotKey from './hooks/use-hotkey';


function App() {
    const { langStore, commonStore, userStore } = useGlobalStore();
    const { appKey, navMode } = commonStore;
    const { userName } = userStore;

    useEffect(() => {
        initRathWorker(commonStore.computationEngine);
        return () => {
            destroyRathWorker();
        };
    }, [commonStore]);
    
    useEffect(() => {
        userStore.updateAuthStatus().then((res) => {
            if (res) {
                userStore.getPersonalInfo();
            }
        });
    }, [userStore]);

    const [showPerformanceWindow, setShowPerformanceWindow] = useState(false);
    useHotKey({
        'Control+Shift+P': () => setShowPerformanceWindow(on => !on),
    });
    
    useEffect(() => {
        const { loggedIn } = userStore;
        const preferences = getPreferencesSchema();
        loadPreferences().then(preferenceValues => {
            if (preferenceValues) {
                try {
                    const prev = toJSONValues(preferences);
                    const diff = diffJSON(JSON.parse(prev), preferenceValues);
                    for (const [key, value] of Object.entries(diff)) {
                        const item = getItem(preferences, key);
                        // @ts-expect-error correct
                        item?.onChange(value);
                    }
                } catch {
                    // do nothing
                }
            } else {
                savePreferences(preferences);
            }
        });
        if (loggedIn && userName) {
            // TODO: save online
        }
    }, [userName, userStore]);

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
                    <div className="message-container">
                        <MessageSegment />
                    </div>
                    {appKey === PIVOT_KEYS.dataSource && <DataSourceBoard />}
                    {appKey === PIVOT_KEYS.editor && <VisualInterface />}
                    {appKey === PIVOT_KEYS.support && <SupportPage />}
                    {appKey === PIVOT_KEYS.megaAuto && <LTSPage />}
                    {appKey === PIVOT_KEYS.semiAuto && <PatternPage />}
                    {appKey === PIVOT_KEYS.painter && <Painter />}
                    {appKey === PIVOT_KEYS.dashBoardDesigner && <ProgressiveDashboard />}
                    {appKey === PIVOT_KEYS.collection && <Collection />}
                    {appKey === PIVOT_KEYS.dashboard && <Dashboard />}
                    {appKey === PIVOT_KEYS.causal && <CausalPage />}
                    {appKey === PIVOT_KEYS.preference && <PreferencePage />}
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
