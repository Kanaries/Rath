import React, { useMemo, useState } from 'react';
import { DataSource, BIField, Field } from '../../global';
import FieldAnalysisBoard, { FieldDescription } from './fieldAnalysis';
import Subspaces from './subspaces';
import { FieldSummary, Subspace } from '../../service';
import ClusterBoard from './cluster';
import { clusterMeasures, kruskalMST } from 'visual-insights';
import { useGlobalState } from '../../state';
import './index.css';

interface NoteBookProps {
  dimScores: [string, number, number, Field][],
  summaryData: {
    originSummary: FieldSummary[],
    groupedSummary: FieldSummary[]
  },
  subspaceList: Subspace[]
}
const NoteBook: React.FC<NoteBookProps> = (props) => {
  const { dimScores, summaryData, subspaceList } = props;
  const { originSummary, groupedSummary } = summaryData;
  interface ClusterState {
    measures: string[];
    matrix: number[][];
  }
  const [clusterState, setClusterState] = useState<ClusterState>({
    measures: [],
    matrix: [[]]
  })
  const fieldsDesc = useMemo<FieldDescription[]>(() => {
    return dimScores.map(dim => {
      return {
        name: dim[0],
        type: dim[3].type,
        impurity: [{
          name: 'entropy',
          value: dim[1]
        }, {
          name: 'max_entropy',
          value: dim[2]
        }]
      }
    })
  }, [dimScores])
  return <div>
    <h3 className="notebook header">Univariate Summary</h3>
    <div className="notebook content container">
      <FieldAnalysisBoard fields={fieldsDesc} originSummary={originSummary} groupedSummary={groupedSummary} />
    </div>
    
    <h3 className="notebook header">Subspace Searching</h3>
    <div className="notebook content center container">
      <Subspaces subspaceList={subspaceList} onSpaceChange={(measures, matrix) => {
        setClusterState({
          measures,
          matrix
        })
      }} />
    </div>

    <h3 className="notebook header">Measurement Clustering</h3>
    <div className="notebook content center container">
      <ClusterBoard adjMatrix={clusterState.matrix} measures={clusterState.measures} />
    </div>

    <h3 className="notebook header">Visualization</h3>
    <div className="notebook content center container">

    </div>
    
  </div>
}

export default NoteBook;