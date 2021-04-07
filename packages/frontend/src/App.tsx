import React, { useMemo } from "react";
import intl from 'react-intl-universal';
import { useGlobalState, GlobalStateProvider } from "./state";
import { useGlobalStore, StoreWrapper } from './store/index'
import { Pivot, PivotItem } from "office-ui-fabric-react";
import { useComposeState } from "./utils/index";
import "./App.css";
// import RathLogo from './assets/kanaries-lite.png';
// import RathCoolLogo from './assets/rath-glasses.png';

import Gallery from "./pages/gallery/index";
import NoteBook from "./pages/notebook/index";
import VisualEditor from './pages/visualEditor';
import DataSourceBoard from "./pages/dataSource/index";
import DashBoardPage from './pages/dashBoard/index';
import DevPage from './pages/dev';
import SupportPage from './pages/support/index';
import UserSettings from './components/userSettings';
import { observer } from "mobx-react-lite";

// FIXME: 这两代码好像没什么用
require('intl/locale-data/jsonp/en.js')
require('intl/locale-data/jsonp/zh.js')

const getLogoSrc = (withGlasses: boolean) => {
  return withGlasses ? "/assets/rath-glasses.png" : "/assets/kanaries-lite.png";
};

interface PageStatus {
  show: {
    insightBoard: boolean;
    configPanel: boolean;
    fieldConfig: boolean;
    dataConfig: boolean;
  };
  current: {
    pivotKey: string;
  };
}

function App() {
  const [state, ] = useGlobalState();
  const { langStore } = useGlobalStore()
  const pivotList = useMemo(() => {
    return [
      intl.get('menu.dataSource'),
      intl.get('menu.noteBook'),
      intl.get('menu.explore'),
      intl.get('menu.dashBoard'),
      intl.get('menu.explainer'),
      intl.get('menu.editor'),
      intl.get('menu.support')
    ].map((page, index) => {
      return { title: page, itemKey: 'pivot-' + (index + 1) }
    })
    // FIXME: 未来完全mobx化之后，就可以不缓存
  }, [langStore.lang])
  const [pageStatus, setPageStatus] = useComposeState<PageStatus>({
    show: {
      insightBoard: false,
      fieldConfig: false,
      configPanel: false,
      dataConfig: false,
    },
    current: {
      pivotKey: pivotList[0].itemKey,
    },
  })
  return (
    <div>
      <div className="header-bar">
        <div className="ms-Grid-row" dir="ltr">
          <div className="ms-Grid-col ms-sm6 ms-md4 ms-lg1">
            <a
              // onClick={() => { window.location.reload(false); }}
              href="https://github.com/ObservedObserver/visual-insights"
              className="logo"
            >
              <img
                style={!state.beCool ? { width: '48px', marginTop: '4px' } : undefined}
                src={getLogoSrc(state.beCool)}
                alt="rath"
              />
            </a>
          </div>
          <div className="ms-Grid-col ms-sm6 ms-md8 ms-lg8">
            <Pivot
              selectedKey={pageStatus.current.pivotKey}
              onLinkClick={(item) => {
                item &&
                  item.props.itemKey &&
                  setPageStatus((draft) => {
                    draft.current.pivotKey = item.props.itemKey!
                  })
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
      </div>
      {pageStatus.current.pivotKey === 'pivot-3' && (
        <Gallery subspaceList={state.subspaceList} dataSource={state.cookedDataSource} summary={state.summary} />
      )}
      {pageStatus.current.pivotKey === 'pivot-1' && (
        <DataSourceBoard
          onExtractInsights={() => {
            setPageStatus((draft) => {
              draft.current.pivotKey = 'pivot-3'
              draft.show.insightBoard = true
            })
          }}
        />
      )}
      {pageStatus.current.pivotKey === 'pivot-2' && (
        <div className="content-container">
          <div className="card">
            <NoteBook summary={state.summary} subspaceList={state.subspaceList} dataSource={state.cookedDataSource} />
          </div>
        </div>
      )}
      {pageStatus.current.pivotKey === 'pivot-4' && <DashBoardPage />}
      {pageStatus.current.pivotKey === 'pivot-5' && <DevPage />}
      {pageStatus.current.pivotKey === 'pivot-6' && <VisualEditor dataSource={state.cookedDataSource} dimensions={state.cookedDimensions} measures={state.cookedMeasures} />}
      {pageStatus.current.pivotKey === 'pivot-7' && <SupportPage />}
    </div>
  )
}

const OBApp = observer(App);

export default function WrappedApp() {
  return (
    <StoreWrapper>
      <GlobalStateProvider>
        <OBApp />
      </GlobalStateProvider>
    </StoreWrapper>
  );
}
