import React, { useMemo } from 'react';
import { DataSource, BIField, Field } from '../../global';
import FieldAnalysisBoard, { FieldDescription } from './fieldAnalysis';
import Subspaces from './subspaces';
import { FieldSummary, Subspace } from '../../service';

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
    <FieldAnalysisBoard fields={fieldsDesc} originSummary={originSummary} groupedSummary={groupedSummary} />
    <Subspaces subspaceList={subspaceList} />
  </div>
}

export default NoteBook;