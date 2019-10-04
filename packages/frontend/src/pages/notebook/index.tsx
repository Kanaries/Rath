import React, { useMemo } from 'react';
import { DataSource, BIField, Field } from '../../global';
import FieldAnalysisBoard, { FieldDescription } from './fieldAnalysis';
interface NoteBookProps {
  dimScores: [string, number, number, Field][]
}
const NoteBook: React.FC<NoteBookProps> = (props) => {
  const { dimScores } = props;
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
    <FieldAnalysisBoard fields={fieldsDesc} />
  </div>
}

export default NoteBook;