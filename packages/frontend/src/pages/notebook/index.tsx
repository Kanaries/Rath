import React, { useMemo, useState } from 'react';
import { DataSource, BIField, Field } from '../../global';
import FieldAnalysisBoard from './fieldAnalysis';
import Subspaces from './subspaces';
import { FieldSummary, Subspace } from '../../service';
import ClusterBoard from './cluster';
import { clusterMeasures, kruskalMST, specification } from 'visual-insights';
import { DefaultButton, ProgressIndicator } from 'office-ui-fabric-react';
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
    <ProgressIndicator description="analyzing" />
    <div className="notebook content container">
      <FieldAnalysisBoard originSummary={originSummary} groupedSummary={groupedSummary} />
    </div>

    <h3 className="notebook header">Subspace Searching</h3>
    <ProgressIndicator description="analyzing" />
    <div className="notebook content center container">
      <Subspaces subspaceList={subspaceList} onSpaceChange={(dimensions, measures, matrix) => {
        setClusterState({
          dimensions,
          measures,
          matrix
        })
      }} />
    </div>

    <h3 className="notebook header">Measurement Clustering</h3>
    <ProgressIndicator description="analyzing" />
    <div className="notebook content center container">
      <ClusterBoard adjMatrix={clusterState.matrix} measures={clusterState.measures} onFocusGroup={(measInView) => {setMeasuresInView(measInView); console.log('view in measures', measInView)}} />
    </div>

    <h3 className="notebook header">Visualization</h3>
    <ProgressIndicator description="analyzing" />
    <div className="notebook content center container" style={{overflowX: 'auto'}}>
      <VegaBase defaultAggregated={false} defaultStack={true} aggregator={'sum'}
        schema={spec}
        fieldFeatures={dimScores.map(dim => dim[3])}
        dataSource={JSON.parse(JSON.stringify(state.cookedDataSource))}
        dimensions={clusterState.dimensions} measures={measuresInView} />
    </div>

  </div>
}

export default NoteBook;