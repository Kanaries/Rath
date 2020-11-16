import React, { useState } from "react";
import intl from 'react-intl-universal';
import { PrimaryButton, DefaultButton, Stack, Separator, ProgressIndicator } from "office-ui-fabric-react";
import { useGlobalState } from "../../state";
import CombinedChart from "./combinedChart";

const DashBoardPage: React.FC = props => {
  const [state, , dispatch, getters] = useGlobalState();
  const [dashBoardIndex, setDashBoardIndex] = useState(0);
  const {
    subspaceList,
    cookedDataSource,
    cookedDimensions,
    cookedMeasures,
    dashBoardList
  } = state;
  const { dimScores } = getters;
  return (
    <div className="content-container">
      <div className="card">
        <PrimaryButton
          text={intl.get('dashBoard.generateButton')}
          disabled={subspaceList.length === 0}
          iconProps={{ iconName: 'AreaChart' }}
          onClick={() => {
            dispatch('getDashBoard', {
              dataSource: cookedDataSource,
              dimensions: cookedDimensions,
              measures: cookedMeasures,
            })
          }}
        />
        {state.loading.dashBoard && <ProgressIndicator description="generating dashboard" />}
        <Separator>
          {intl.get('dashBoard.pageNo', { current: dashBoardIndex + 1, total: dashBoardList.length })}
        </Separator>
        <Stack horizontal tokens={{ childrenGap: 20 }}>
          <DefaultButton
            text={intl.get('dashBoard.last')}
            onClick={() => {
              setDashBoardIndex((index) => (index + dashBoardList.length - 1) % dashBoardList.length)
            }}
            allowDisabledFocus
          />
          <DefaultButton
            text={intl.get('dashBoard.next')}
            onClick={() => {
              setDashBoardIndex((index) => (index + 1) % dashBoardList.length)
            }}
            allowDisabledFocus
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
          {dashBoardList[dashBoardIndex] && dashBoardList[dashBoardIndex].length > 0 && (
            <CombinedChart
              dataSource={cookedDataSource}
              dashBoard={dashBoardList[dashBoardIndex]}
              dimScores={dimScores}
            />
          )}
        </div>
      </div>
    </div>
  )
};

export default DashBoardPage;
