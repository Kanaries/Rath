import React, { useEffect } from 'react';
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
import PerformanceWindow from './components/performance-window';
import LoginInfo from './pages/loginInfo';
import Account from './pages/loginInfo/account';
import Info from './pages/loginInfo/info';
import Setup from './pages/loginInfo/setup';
import Header from './pages/loginInfo/header';

export enum PreferencesType {
    Account = 'account',
    Info = 'info',
    Setting = 'setting',
    Header = 'header'
}
export interface PreferencesListType {
    key: PreferencesType;
    name: PreferencesType;
    icon: string;
    element: () => JSX.Element;
}

const preferencesList: PreferencesListType[] = [
    { key: PreferencesType.Account, name: PreferencesType.Account, icon: 'Home', element: () => <Account /> },
    // { key: PreferencesType.Info, name: PreferencesType.Info, icon: 'Info', element: () => <Info /> },
    // { key: PreferencesType.Header, name: PreferencesType.Header, icon: 'Contact', element: () => <Header /> },
    { key: PreferencesType.Setting, name: PreferencesType.Setting, icon: 'Settings', element: () => <Setup /> },
];

function App() {
    const { langStore, commonStore } = useGlobalStore();
    const { appKey, navMode } = commonStore;

    useEffect(() => {
        initRathWorker(commonStore.computationEngine);
        commonStore.updateAuthStatus().then((res) => {
            if (res) {
                commonStore.getPersonalInfo();
                commonStore.getAvatarImgUrl()
            }
        });
        return () => {
            destroyRathWorker();
        };
    }, [commonStore]);

    if (!langStore.loaded) {
        return (
            <div style={{ marginTop: '6em' }}>
                <Spinner label="Initializing Rath..." size={SpinnerSize.large} />
            </div>
        );
    }

    const showPerformanceWindow = (new URL(window.location.href).searchParams.get('performance') ?? (
        JSON.stringify(process.env.NODE_ENV !== 'production') && false  // temporarily banned this feature
    )) === 'true';

    return (
        <div>
            <div className="main-app-container">
                <div className="main-app-nav" style={{ flexBasis: navMode === 'text' ? '220px' : '3px' }}>
                    <LoginInfo
                        element={() => {
                            return <AppNav />;
                        }}
                        preferencesList={preferencesList}
                    />
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
