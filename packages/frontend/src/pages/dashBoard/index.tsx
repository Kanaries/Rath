import React from 'react';
import { DefaultButton } from 'office-ui-fabric-react';
import { useGlobalState } from '../../state';
import CombinedChart from './combinedChart';

const DashBoardPage: React.FC = props => {
  const [state, updateState, dispatch, getters] = useGlobalState();
  const { subspaceList, cookedDataSource, cookedDimensions, cookedMeasures, dashBoardList } = state;
  const { dimScores } = getters;
  return <div className="content-container">
    <div className="card">
      <DefaultButton text="Generate Dashboard" disabled={subspaceList.length === 0} onClick={() => {
        dispatch('getDashBoard', {
          dataSource: cookedDataSource,
          dimensions: cookedDimensions,
          measures: cookedMeasures
        })
      }} />
      <p className="state-description">
        Double click the chart with selection to clear selection(filter).
      </p>
      <div style={{ overflowX: 'auto', margin: '1rem', border: '1px solid #e8e8e8' }}>
        <CombinedChart dataSource={cookedDataSource} dashBoard={dashBoardList[0]} dimScores={dimScores} />
      </div>
    </div>
  </div>
}

export default DashBoardPage;
