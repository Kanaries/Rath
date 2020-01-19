import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Subspace } from '../../service';
import embed from 'vega-embed';
import { DataSource } from '../../global';

function encodeArr (arr: any[]): string {
  return arr.join(',')
}
interface SubspacesProps {
  subspaceList: Subspace[];
  onSpaceChange: (dimensions: string[], measures: string[], matrix: number[][]) => void
}
const Subspaces: React.FC<SubspacesProps> = (props) => {
  const { subspaceList, onSpaceChange } = props;
  const [curIndex, setCurIndex] = useState(0);
  const spaceChart = useRef<HTMLDivElement>(null)
  const relationChart = useRef<HTMLDivElement>(null)
  // const subspaces = useMemo<IndexSubspace[]>(() => {
  //   return subspaceList.map((space, index) => {
  //     return {
  //       ...space,
  //       index
  //     }
  //   })
  // }, [subspaceList]);
  useEffect(() => {
    let index = subspaceList.length - 1;
    if (index > -1) {
      let targetSpace = subspaceList[index];
      onSpaceChange(targetSpace.dimensions, targetSpace.measures.map(m => m.name), targetSpace.correlationMatrix);
      setCurIndex(index);
    }
  }, [subspaceList, onSpaceChange])

  const values = useMemo<DataSource>(() => {
    let ans = [];
    // todos:
    // the fold operation here is a tmp solution. it is designed when I don't there is a api in vega to handle event listener.
    // the fold operation here can caused a wasted of time and space.
    // I suggested to divied it into two charts and connect the logic throgh a state manager outside the charts.
    for (let i = 0; i < subspaceList.length; i++) {
      let space = subspaceList[i];
      let dimensions = encodeArr(space.dimensions)
      for (let { name, value } of space.measures) {
        let record: any = {
          test: i,
          score: space.score,
          dimensions,
          measureName: name,
          measureValue: value,
        };
        ans.push(record)
      }
    }
    return ans
  }, [subspaceList])
  useEffect(() => {
    if (spaceChart.current && subspaceList.length > 0) {
      embed(spaceChart.current, {
        data: {
          values
        },
        vconcat: [
          {
            mark: 'rect',
            selection: {
              dim: {
                type: 'single',
                on: 'click',
                encodings: ['y']
              }
            },
            encoding: {
              x: { field: 'measureName', type: 'nominal' },
              y: {
                field: 'dimensions',
                type: 'ordinal',
                sort: { field: 'score' }
              },
              color: { field: 'measureValue', type: 'quantitative', aggregate: 'mean', scale: { reverse: true } },
              opacity: {
                condition: {selection: 'dim', value: 1},
                value: 0.72
              },
            }
          }
        ]
      }).then(res => {
        res.view.addEventListener('click', function (e, item) {
          if (item) {
            /**
             * record is the data record(defiend in `values`) the event contains.
             */
            let record = item.datum;
            let index = subspaceList.findIndex(space => encodeArr(space.dimensions) === record.dimensions)

            if (index > -1) {
              let targetSpace = subspaceList[index];
              onSpaceChange(targetSpace.dimensions, targetSpace.measures.map(m => m.name), targetSpace.correlationMatrix);
              setCurIndex(index);
            }
          }
        })
      })
    }
    // eslint-disable-next-line
  }, [subspaceList, values])
  useEffect(() => {
    let space = subspaceList[curIndex];
    if (relationChart.current && subspaceList.length > 0 && space) {
      let matrix: DataSource = [];
      
      for (let i = 0; i < space.correlationMatrix.length; i++) {
          for (let j = 0; j < space.correlationMatrix[i].length; j++) {
            matrix.push({
              x: space.measures[i].name,
              y: space.measures[j].name,
              correlation: space.correlationMatrix[i][j]
            })
          }
        }
      embed(relationChart.current, {
        data: {
          values: matrix
        },
        mark: 'rect',
        encoding: {
          x: { field: 'x', type: 'nominal' },
          y: { field: 'y', type: 'nominal' },
          color: { field: 'correlation', type: 'quantitative', aggregate: 'mean' , scale: { scheme: 'redyellowgreen', domain: [-1, 1] } }
        }
      })
    }
    
  }, [subspaceList, curIndex])
  return <div>
    <div ref={spaceChart}></div>
    <div ref={relationChart}></div>
  </div>
}

export default Subspaces;