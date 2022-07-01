import React, { useEffect } from "react";
import { useGlobalStore, StoreWrapper } from './store/index'
import { observer } from "mobx-react-lite";
import "./App.css";

import Gallery from "./pages/gallery/index";
import NoteBook from "./pages/notebook/index";
import VisualInterface from './pages/manualControl';
import DataSourceBoard from "./pages/dataSource/index";
import DashBoardPage from './pages/dashBoard/index';
import PatternPage from './pages/semiAutomation/index';
import DevPage from './pages/dev';
import SupportPage from './pages/support/index';
import LTSPage from './pages/megaAutomation';
import MessageSegment from "./components/messageSegment";
import AppNav from "./components/appNav";
import { destroyRathWorker, initRathWorker } from "./service";
import { PIVOT_KEYS } from "./constants";
import CrInfo from "./components/crInfo";
import { Spinner, SpinnerSize } from "office-ui-fabric-react";
// import { loadTheme } from "office-ui-fabric-react";
// import { RATH_DARK_PALETTE, RATH_DARK_THEME } from "./theme";


// FIXME: 这两代码好像没什么用
require('intl/locale-data/jsonp/en.js')
require('intl/locale-data/jsonp/zh.js')

function App() {
  const { langStore, commonStore } = useGlobalStore()
  const { appKey, navMode } = commonStore;

  useEffect(() => {
    initRathWorker(commonStore.computationEngine);
    // notify({
    //   title: 'test',
    //   type: 'info',
    //   content: 'thisn asiudfhius diuahsi iudh fiuasdf'
    // })
    // notify({
    //   title: 'test',
    //   type: 'info',
    //   content: 'thisn asiudfhius diuahsi iudh fiuasdf'
    // })
    return () => {
      destroyRathWorker();
    }
  }, [commonStore])

  if (!langStore.loaded) {
    return <div style={{ marginTop: '6em' }}>
      <Spinner label="Initializing Rath..." size={SpinnerSize.large} />
    </div>
  }

  return (
    <div>
      {/* <div className="header-bar">
        <div className="ms-Grid-row" dir="ltr">
          <div className="ms-Grid-col ms-sm6 ms-md4 ms-lg1">
            <a
              // onClick={() => { window.location.reload(false); }}
              href="https://github.com/Kanaries/Rath"
              className="logo"
            >
              <img
                style={{ width: '38px', marginTop: '4px' }}
                src="./assets/kanaries-lite.png"
                alt="rath"
              />
            </a>
          </div>
          <div className="ms-Grid-col ms-sm6 ms-md8 ms-lg8">
            <Pivot
              selectedKey={appKey}
              onLinkClick={(item) => {
                item &&
                  item.props.itemKey &&
                  commonStore.setAppKey(item.props.itemKey)
              }}
              headersOnly={true}
            >
              {pivotList.map((pivot) => (
                <PivotItem key={pivot.itemKey} headerText={pivot.title} itemKey={pivot.itemKey} />
              ))}
            </Pivot>
          </div>
          <div className="ms-Grid-col ms-sm6 ms-md8 ms-lg3">
            <div className="header-toolbar">
              <UserSettings />
            </div>
          </div>
        </div>
      </div> */}
      <div className="main-app-container">
        <div className="main-app-nav" style={{ flexBasis: navMode === 'text' ? '220px' : '20px' }}>
          <AppNav />
        </div>
        <div className="main-app-content">
        <div className="message-container">
          <MessageSegment />
        </div>
        {appKey === PIVOT_KEYS.gallery && (
          <Gallery />
        )}
        {appKey === PIVOT_KEYS.dataSource && (
          <DataSourceBoard />
        )}
        {appKey === PIVOT_KEYS.noteBook && (
          <div className="content-container">
            <div className="card">
              <NoteBook />
            </div>
          </div>
        )}
        {appKey === PIVOT_KEYS.dashBoard && <DashBoardPage />}
        {appKey === PIVOT_KEYS.explainer && <DevPage />}
        {appKey === PIVOT_KEYS.editor && <VisualInterface />}
        {appKey === PIVOT_KEYS.support && <SupportPage />}
        {appKey === PIVOT_KEYS.lts && <LTSPage />}
        {appKey === PIVOT_KEYS.pattern && <PatternPage />}
        <CrInfo />
        </div>
      </div>
    </div>
  )
}

const OBApp = observer(App);

// loadTheme(RATH_DARK_THEME);

export default function WrappedApp() {
  return (
    <StoreWrapper>
        <OBApp />
    </StoreWrapper>
  );
}
