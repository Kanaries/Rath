import { Request, Response, RequestHandler } from 'express';
import { kruskalMST } from 'visual-insights';
interface MeasureDetail {
  name: string;
  value: number
}
interface Space {
  dimensions: string[];
  matrix: number[][];
  measures: MeasureDetail[];
}
interface RequestBody {
  spaces: Space[];
  maxGroupNumber: number;
}

function sum (arr: number[]) {
  let ans = 0;
  let len = arr.length;
  for (let i = 0; i < len; i++) {
    ans += arr[i];
  }
  return ans;
}
const cluster: RequestHandler = (req, res) => {
  console.log('[cluster measures]')
  try {
    const { spaces, maxGroupNumber } = req.body as RequestBody;
    let result = [];
    for (let space of spaces) {
      // let maxGroupNumber = space.measures.length / 4
      const { edgesInMST, groups } = kruskalMST(space.matrix, maxGroupNumber);
      let measureGroups: Map<number, MeasureDetail[]> = new Map();
      for (let i = 0; i < groups.length; i++) {
        if (!measureGroups.has(groups[i])) {
          measureGroups.set(groups[i], [])
        }
        // fuck typescript
        measureGroups.get(groups[i])!.push(space.measures[i])
      }
      for (let group of measureGroups.values()) {
        result.push({
          dimensions: space.dimensions,
          measures: group.map(mea => mea.name),
          // how to get a good score here ？
          score: sum(group.map(mea => mea.value))
        })
      }
    }
    result.sort((a, b) => a.score - b.score)
    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.toString()
    }) 
  }
}

export default cluster;