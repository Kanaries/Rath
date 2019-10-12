import { RequestHandler } from 'express';
import { kruskalMST } from 'visual-insights';
interface Space {
  dimensions: string[];
  matrix: number[][];
  measures: string[];
}
interface RequestBody {
  spaces: Space[];
}
const cluster: RequestHandler = (req, res) => {
  console.log('[cluster measures]')
  try {
    const { spaces } = req.body as RequestBody;
    let result = [];
    for (let space of spaces) {
      const { edgesInMST, groups } = kruskalMST(space.matrix);
      let measureGroups: Map<number, string[]> = new Map();
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
          measures: group
        })
      }
    }
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