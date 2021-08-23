import React from "react";
import intl from 'react-intl-universal';
import { useGlobalStore, StoreWrapper } from './store/index'
import { Pivot, PivotItem } from "office-ui-fabric-react";
import { useComposeState } from "./utils/index";
import "./App.css";

import Gallery from "./pages/gallery/index";
import NoteBook from "./pages/notebook/index";
import VisualInterface from './pages/visualInterface';
import DataSourceBoard from "./pages/dataSource/index";
import DashBoardPage from './pages/dashBoard/index';
import DevPage from './pages/dev';
import SupportPage from './pages/support/index';
import UserSettings from './components/userSettings';
import { observer } from "mobx-react-lite";

// FIXME: 这两代码好像没什么用
require('intl/locale-data/jsonp/en.js')
require('intl/locale-data/jsonp/zh.js')

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
  const { langStore } = useGlobalStore()

  let pivotKeys: string[] = ['dataSource', 'noteBook', 'explore', 'dashBoard', 'explainer', 'editor', 'support'];

  let pivotList = pivotKeys.map((page, index) => {
    return { title: page, itemKey: 'pivot-' + (index + 1) }
  })

  if (langStore.loaded) {
    pivotList = pivotKeys.map(p => intl.get(`menu.${p}`))
      .map((page, index) => {
        return { title: page, itemKey: 'pivot-' + (index + 1) }
      })
  }

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

  if (!langStore.loaded) {
    return <div></div>
  }

  return (
    <div>
      <div className="header-bar">
        <div className="ms-Grid-row" dir="ltr">
          <div className="ms-Grid-col ms-sm6 ms-md4 ms-lg1">
            <a
              // onClick={() => { window.location.reload(false); }}
              href="https://github.com/Kanaries/Rath"
              className="logo"
            >
              <img
                style={{ width: '38px', marginTop: '4px' }}
                src="/assets/kanaries-lite.png"
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
        <Gallery />
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
            <NoteBook />
          </div>
        </div>
      )}
      {pageStatus.current.pivotKey === 'pivot-4' && <DashBoardPage />}
      {pageStatus.current.pivotKey === 'pivot-5' && <DevPage />}
      {pageStatus.current.pivotKey === 'pivot-6' && <VisualInterface />}
      {pageStatus.current.pivotKey === 'pivot-7' && <SupportPage />}
    </div>
  )
}

const OBApp = observer(App);

export default function WrappedApp() {
  return (
    <StoreWrapper>
        <OBApp />
    </StoreWrapper>
  );
}
