import { useMemo } from 'react';
import { ViewSpace } from '../../../service';
import { Field, DataSource } from '../../../global';
import { specification } from 'visual-insights';
import { PreferencePanelConfig } from '../../../components/preference';
const similarityThrehold = 0.2;
const topKRelatedSpace = 5;

function measuresRelatedScore (measures1: string[], measures2: string[]) {
  let meaSet = new Set([...measures1, ...measures2])
  let meaSet1 = new Set(measures1)
  let meaSet2 = new Set(measures2)
  let meaVec1: number[] = [];
  let meaVec2: number[] = [];
  for (let mea of meaSet) {
    meaVec1.push(Number(meaSet1.has(mea)))
    meaVec2.push(Number(meaSet2.has(mea)))
  }
  let score = 0;
  for (let i = 0; i < meaVec1.length; i++) {
    score += meaVec1[i] * meaVec2[i];
  }
  score /= (Math.sqrt(measures1.length) * Math.sqrt(measures2.length))
  // console.log(measures1, measures2, score)
  return score;
}
interface RelatedViewSpace extends ViewSpace {
  relatedScore: number;
}
export interface DigDimensionProps {
  /**
   * we suppose that viewSpaces here is a ranked space list
   */
  viewSpaces: ViewSpace[];
  interestedViewSpace: ViewSpace;
  fieldScores: Array<[string, number, number, Field]>;
  dataSource: DataSource;
  visualConfig: PreferencePanelConfig
}

function useDigDimension(props: DigDimensionProps) {
  const { viewSpaces, interestedViewSpace, fieldScores, dataSource } = props;
  const relatedSpaces = useMemo<ViewSpace[]>(() => {
    let ans: ViewSpace[] = []
    for (let space of viewSpaces) {
      if (space.dimensions.length > interestedViewSpace.dimensions.length && space.dimensions.length - interestedViewSpace.dimensions.length <= 2) {
        let isSubset = interestedViewSpace.dimensions.every(subDim => {
          return space.dimensions.find(dim => subDim === dim)
        })
        if (isSubset) {
          ans.push(space)
        }
      }
    }
    return ans;
  }, [interestedViewSpace, viewSpaces])
  const rankedRelatedSpaces = useMemo(() => {
    let ans: RelatedViewSpace[] = [];
    for (let space of relatedSpaces) {
      let measureSimilarity = measuresRelatedScore(interestedViewSpace.measures, space.measures);
      if (measureSimilarity > similarityThrehold) {
        // console.log({ measureSimilarity })
        ans.push({
          ...space,
          relatedScore: space.score / Math.sqrt(measureSimilarity)
        })
      }
    }
    return ans.sort((a, b) => a.relatedScore - b.relatedScore);
  }, [relatedSpaces, interestedViewSpace.measures]);

  const viewList = useMemo(() => {
    const ans = rankedRelatedSpaces.slice(0, topKRelatedSpace).map(space => {
      let spaceFieldScores = fieldScores.filter(field => {
        return space.dimensions.includes(field[0]) || space.measures.includes(field[0])
      })
      return {
        ...space,
        schema: specification(spaceFieldScores, dataSource, space.dimensions, space.measures).schema
      };
    })
    return ans;
  }, [rankedRelatedSpaces, fieldScores, dataSource])

  return viewList
}

export default useDigDimension;
