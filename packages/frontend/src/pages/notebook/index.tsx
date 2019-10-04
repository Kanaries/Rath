import React, { useMemo } from 'react';
import { DataSource, BIField, Field } from '../../global';
import FieldAnalysisBoard, { FieldDescription } from './fieldAnalysis';
import { FieldSummary } from '../../service';

interface NoteBookProps {
  dimScores: [string, number, number, Field][],
  summaryData: {
    originSummary: FieldSummary[],
    groupedSummary: FieldSummary[]
  }
}
const NoteBook: React.FC<NoteBookProps> = (props) => {
  const { dimScores, summaryData } = props;
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
  </div>
}

export default NoteBook;