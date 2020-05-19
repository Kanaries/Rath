import React from "react";
import { useGlobalState, GlobalStateProvider } from "./state";
import { Pivot, PivotItem } from "office-ui-fabric-react";
import { useComposeState } from "./utils/index";
import "./App.css";
import RathLogo from './assets/kanaries-lite.png';
import RathCoolLogo from './assets/rath-glasses.png';

import Gallery from "./pages/gallery/index";
import NoteBook from "./pages/notebook/index";
import DataSourceBoard from "./pages/dataSource/index";
import DashBoardPage from './pages/dashBoard/index';
import DevPage from './pages/dev';
import UserSettings from './components/userSettings';

const pivotList = [
  'DataSource',
  'NoteBook',
  'Explore',
  'DashBoard',
  'Dev'
].map((page, index) => {
  return { title: page, itemKey: 'pivot-' + (index + 1)}
});

const getLogoSrc = (withGlasses: boolean) => {
  return withGlasses
    ? RathCoolLogo
    : RathLogo;
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
  const [pageStatus, setPageStatus] = useComposeState<PageStatus>({
    show: {
      insightBoard: false,
      fieldConfig: false,
      configPanel: false,
      dataConfig: false
    },
    current: {
      pivotKey: pivotList[0].itemKey
    }
  });
  return (
    <div>
      <div className="header-bar">
        <div className="ms-Grid-row">
          <div className="ms-Grid-col ms-sm6 ms-md4 ms-lg1">
            <a
              // onClick={() => { window.location.reload(false); }}
              href="https://github.com/ObservedObserver/visual-insights"
              className="logo"
            >
              <img style={!state.beCool ? { width: '48px', marginTop: '4px' } : undefined} src={ getLogoSrc(state.beCool) } alt="rath" />
            </a>
          </div>
          <div className="ms-Grid-col ms-sm6 ms-md8 ms-lg8">
            <Pivot
              selectedKey={pageStatus.current.pivotKey}
              onLinkClick={item => {
                item &&
                  item.props.itemKey &&
                  setPageStatus(draft => {
                    draft.current.pivotKey = item.props.itemKey!;
                  });
              }}
              headersOnly={true}
            >
              {pivotList.map(pivot => (
                <PivotItem
                  key={pivot.itemKey}
                  headerText={pivot.title}
                  itemKey={pivot.itemKey}
                />
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
      {pageStatus.current.pivotKey === "pivot-3" && (
        <Gallery
          subspaceList={state.subspaceList}
          dataSource={state.cookedDataSource}
          summary={state.summary}
        />
      )}
      {pageStatus.current.pivotKey === "pivot-1" && <DataSourceBoard onExtractInsights={() => {
        setPageStatus(draft => {
          draft.current.pivotKey = "pivot-2";
          draft.show.insightBoard = true;
        });
      }
      } />}
      {pageStatus.current.pivotKey === "pivot-2" && (
        <div className="content-container">
          <div className="card">
            <NoteBook
              summary={state.summary}
              subspaceList={state.subspaceList}
              dataSource={state.cookedDataSource}
            />
          </div>
        </div>
      )}
      {
        pageStatus.current.pivotKey === 'pivot-4' && <DashBoardPage />
      }
      {
        pageStatus.current.pivotKey === 'pivot-5' && <DevPage />
      }
    </div>
  );
}

export default function() {
  return (
    <GlobalStateProvider>
      <App />
    </GlobalStateProvider>
  );
}
