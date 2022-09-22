import React, { useMemo } from "react";
import intl from 'react-intl-universal';
import { PrimaryButton, DefaultButton, Stack, Separator, ProgressIndicator, IconButton } from '@fluentui/react';
import { observer } from "mobx-react-lite";
import { useGlobalStore } from "../../store";
import { meta2fieldScores } from "../../utils/transform";
import CombinedChart from "./combinedChart";
import ConfigPannel from "./configPannel";

const DashBoardPage: React.FC = props => {
  const { pipeLineStore, dashBoardStore } = useGlobalStore();
  // const [dashBoardIndex, setDashBoardIndex] = useState(0);

  const { dashBoardList, pageIndex, config } = dashBoardStore;
  const { cookedDataset } = pipeLineStore;
  const { transedData, transedMetas } = cookedDataset;

  const dimScores = useMemo(() => {
    return meta2fieldScores(transedMetas)
  }, [transedMetas])

  return (
    <div className="content-container">
      <ConfigPannel />
      <div className="card">
        <PrimaryButton
          text={intl.get('dashBoard.generateButton')}
          disabled={dashBoardStore.pageDisabled}
          iconProps={{ iconName: 'AreaChart' }}
          onClick={() => {
            dashBoardStore.generateDashBoard();
          }}
        />
        {dashBoardStore.loading && <ProgressIndicator description="generating dashboard" />}
        <Separator>
          {intl.get('dashBoard.pageNo', { current: pageIndex + 1, total: dashBoardList.length })}
        </Separator>
        <Stack horizontal tokens={{ childrenGap: 20 }}>
          <DefaultButton
            text={intl.get('dashBoard.last')}
            onClick={() => {
              dashBoardStore.setPageIndex((pageIndex + dashBoardList.length - 1) % dashBoardList.length)
            }}
            allowDisabledFocus
          />
          <DefaultButton
            text={intl.get('dashBoard.next')}
            onClick={() => {
              dashBoardStore.setPageIndex((pageIndex + dashBoardList.length + 1) % dashBoardList.length)
            }}
            allowDisabledFocus
          />
          <IconButton
                iconProps={{ iconName: 'Settings' }}
                title={intl.get('explore.preference')}
                ariaLabel={intl.get('explore.preference')}
                onClick={() => {
                  dashBoardStore.setShowConfig(true);
                }}
              />
        </Stack>
          <p className="state-description">{intl.get('dashBoard.desc')}</p>
        <div
          style={{
            overflowX: 'auto',
            margin: '1rem',
            border: '1px solid #e8e8e8',
          }}
        >
          {dashBoardList[pageIndex] && dashBoardList[pageIndex].length > 0 && (
            <CombinedChart
              aggregator={config.aggregator}
              dataSource={transedData}
              dashBoard={dashBoardList[pageIndex]}
              dimScores={dimScores}
            />
          )}
        </div>
      </div>
    </div>
  )
};

export default observer(DashBoardPage);
