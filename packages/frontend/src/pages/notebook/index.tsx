import React, { useMemo, useState } from 'react';
import { DataSource, BIField, Field } from '../../global';
import FieldAnalysisBoard from './fieldAnalysis';
import Subspaces from './subspaces';
import { FieldSummary, Subspace, combineFieldsService } from '../../service';
import ClusterBoard from './cluster';
import { clusterMeasures, kruskalMST, specification } from 'visual-insights';
import { DefaultButton, ProgressIndicator, Toggle, Slider } from 'office-ui-fabric-react';
import { useGlobalState } from '../../state';
import VegaBase from '../../demo/vegaBase';
import './index.css';

interface NoteBookProps {
  dataSource: DataSource;
  // dimScores: [string, number, number, Field][],
  summaryData: {
    originSummary: FieldSummary[];
    groupedSummary: FieldSummary[]
  };
  subspaceList: Subspace[]
}
const NoteBook: React.FC<NoteBookProps> = (props) => {
  const { summaryData, subspaceList, dataSource } = props;
  const [state, updateState] = useGlobalState();
  const { originSummary, groupedSummary } = summaryData;
  const [isAggregated, setIsAggregated] = useState(false);
  interface ClusterState {
    measures: string[];
    dimensions: string[];
    matrix: number[][];
  }
  const [clusterState, setClusterState] = useState<ClusterState>({
    measures: [],
    dimensions: [],
    matrix: []
  })

  const [measuresInView, setMeasuresInView] = useState<string[]>([]);


  // todo:
  // should be updated after designing new specification api
  const dimScores = useMemo<[string, number, number, Field][]>(() => {
    return [...originSummary, ...groupedSummary].map(field => {
      return [field.fieldName, field.entropy, field.maxEntropy, { name: field.fieldName, type: field.type }]
    });
  }, [originSummary, groupedSummary])

  const spec = useMemo(() => {
    const { dimensions, measures } = clusterState;
    // todo
    // this condition is not strict enough. dimScores should share same elements with dimensions and measures.
    // maybe use try catch in future
    try {
      /**
       * fieldScores is the scores info for the dims and meas in current view.
       * dimensions should get the grouped new field.
       * measures shall never use the grouped field.
       */
      const fieldScores = dimScores.filter(field => {
        return dimensions.includes(field[0]) || measuresInView.includes(field[0])
      })
      const { schema } = specification(fieldScores, dataSource, dimensions, measuresInView)
      return schema;
    } catch (error) {
      console.log(error)
      return {
        position: []
      }
    }

  }, [dimScores, clusterState, dataSource, measuresInView])

  return <div>
    <h3 className="notebook header">Univariate Summary</h3>
    {state.loading.univariateSummary && <ProgressIndicator description="analyzing" />}
    <div className="notebook content container">
      <FieldAnalysisBoard originSummary={originSummary} groupedSummary={groupedSummary} />
    </div>

    <h3 className="notebook header">Subspace Searching</h3>
    {state.loading.subspaceSearching && <ProgressIndicator description="analyzing" />}
    {!state.loading.subspaceSearching && <Slider value={state.topK.dimensionSize * 100} label="top k percent dimension used" max={100} valueFormat={(value: number) => `${value}%`} showValue={true}
      onChange={(value: number) => {
        updateState(draft => {
          draft.topK.dimensionSize = value / 100;
        })
        const selectedDimensions = state.cookedDimensions.slice(0, Math.round(state.cookedDimensions.length * value / 100));
        combineFieldsService(dataSource, selectedDimensions, state.cookedMeasures, 'sum')
          .then(subspaces => {
            if (subspaces) {
              updateState(draft => {
                draft.subspaceList = subspaces
              })
            }
          })
      }}/>}
      {
        !state.loading.subspaceSearching && <Slider value={state.topK.subspacePercentSize * 100} label="top k percent subspace used" max={100} valueFormat={(value: number) => `${value}%`} showValue={true}
        onChange={(value: number) => {
          updateState(draft => {
            draft.topK.subspacePercentSize = value / 100;
          })
        }}/>
      }
    <div className="notebook content center container">
      <Subspaces subspaceList={subspaceList.slice(0, Math.round(subspaceList.length * state.topK.subspacePercentSize))} onSpaceChange={(dimensions, measures, matrix) => {
        setClusterState({
          dimensions,
          measures,
          matrix
        })
      }} />
    </div>

    <h3 className="notebook header">Measurement Clustering</h3>
    <div className="notebook content center container">
      <ClusterBoard adjMatrix={clusterState.matrix} measures={clusterState.measures} onFocusGroup={(measInView) => { setMeasuresInView(measInView); console.log('view in measures', measInView) }} />
    </div>

    <h3 className="notebook header">Visualization</h3>
    <Toggle checked={isAggregated} label="aggregate measures" defaultChecked onText="On" offText="Off" onChange={(e, checked: boolean | undefined) => {setIsAggregated(!!checked)}} />
    <div className="notebook content center container">
      <VegaBase defaultAggregated={isAggregated} defaultStack={true} aggregator={'sum'}
        schema={spec}
        fieldFeatures={dimScores.map(dim => dim[3])}
        dataSource={JSON.parse(JSON.stringify(dataSource))}
        dimensions={clusterState.dimensions} measures={measuresInView} />
    </div>

  </div>
}

export default NoteBook;