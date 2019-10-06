import React, { useRef, useMemo, useEffect } from 'react';
import { Subspace } from '../../service';
import { DetailsList, SelectionMode, IColumn, Icon, IDetailsRowProps, IDetailsRowStyles, DetailsRow, IRenderFunction, HoverCard, IExpandingCardProps } from 'office-ui-fabric-react';
import embed from 'vega-embed';
import { DataSource } from '../../global';

interface SubspacesProps {
  subspaceList: Subspace[];
  onSpaceChange: (measures: string[], matrix: number[][]) => void
}
const Subspaces: React.FC<SubspacesProps> = (props) => {
  const { subspaceList, onSpaceChange } = props;
  const chart = useRef<HTMLDivElement>(null)
  const values = useMemo<DataSource>(() => {
    let ans = [];
    // todos:
    // the fold operation here is a tmp solution. it is designed when I don't there is a api in vega to handle event listener.
    // the fold operation here can caused a wasted of time and space.
    // I suggested to divied it into two charts and connect the logic throgh a state manager outside the charts.
    for (let space of subspaceList) {
      let dimensions = JSON.stringify(space.dimensions)
      for (let { name, value } of space.measures) {
        let record: any = {
          dimensions,
          measureName: name,
          measureValue: value
        };
        for (let i = 0; i < space.correlationMatrix.length; i++) {
          for (let j = 0; j < space.correlationMatrix[i].length; j++) {
            ans.push({
              ...record,
              x: space.measures[i].name,
              y: space.measures[j].name,
              correlation: space.correlationMatrix[i][j]
            })
          }
        }
      }
    }
    return ans
  }, [subspaceList])
  useEffect(() => {
    if (chart.current) {
      embed(chart.current, {
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
              y: { field: 'dimensions', type: 'nominal' },
              color: { field: 'measureValue', type: 'quantitative' }
            }
          },
          {
            mark: 'rect',
            encoding: {
              x: { field: 'x', type: 'nominal' },
              y: { field: 'y', type: 'nominal' },
              color: { field: 'correlation', type: 'quantitative', scale: { scheme: 'yelloworangered' } }
            },
            transform: [
              {
                filter: { selection: 'dim' }
              }
            ]
          }
        ],
        resolve: {
          scale: {
            color: 'independent'
          }
        }
      }).then(res => {
        res.view.addEventListener('click', function (e, item) {
          console.log(item)
          if (item) {
            /**
             * record is the data record(defiend in `values`) the event contains.
             */
            let record = item.datum;
            let targetSpace = subspaceList.find(space => JSON.stringify(space.dimensions) === record.dimensions)
            
            if (targetSpace) {
              onSpaceChange(targetSpace.measures.map(m => m.name), targetSpace.correlationMatrix);
            }
          }
        })
      })
    }
  }, [subspaceList])
  return <div ref={chart}></div>
}

export default Subspaces;