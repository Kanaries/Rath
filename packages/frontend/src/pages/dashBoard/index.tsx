import React, { useState } from "react";
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
          text="Generate Dashboard"
          disabled={subspaceList.length === 0}
          iconProps={{ iconName: "AreaChart" }}
          onClick={() => {
            dispatch("getDashBoard", {
              dataSource: cookedDataSource,
              dimensions: cookedDimensions,
              measures: cookedMeasures
            });
          }}
        />
        { state.loading.dashBoard && <ProgressIndicator description="generating dashboard" /> }
        <Separator>current page no: {dashBoardIndex + 1} of {dashBoardList.length}</Separator>
        <Stack horizontal tokens={{ childrenGap: 20 }}>
          <DefaultButton
            text="Last"
            onClick={() => {
              setDashBoardIndex(index => (index + dashBoardList.length - 1) % dashBoardList.length)
            }}
            allowDisabledFocus
          />
          <DefaultButton
            text="Next"
            onClick={() => {
              setDashBoardIndex(index => (index + 1) % dashBoardList.length)
            }}
            allowDisabledFocus
          />
        </Stack>
        <p className="state-description">
          Double click the chart with selection to clear selection(filter).
        </p>
        <div
          style={{
            overflowX: "auto",
            margin: "1rem",
            border: "1px solid #e8e8e8"
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
  );
};

export default DashBoardPage;
