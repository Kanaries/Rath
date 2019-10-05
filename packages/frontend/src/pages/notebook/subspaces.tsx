import React, { useRef, useMemo, useEffect } from 'react';
import { Subspace } from '../../service';
import { DetailsList, SelectionMode, IColumn, Icon, IDetailsRowProps, IDetailsRowStyles, DetailsRow, IRenderFunction, HoverCard, IExpandingCardProps } from 'office-ui-fabric-react';
import embed from 'vega-embed';
import { DataSource } from '../../global';

interface SubspacesProps {
  subspaceList: Subspace[];
}
const Subspaces: React.FC<SubspacesProps> = (props) => {
  const { subspaceList } = props;
  const chart = useRef<HTMLDivElement>(null)
  const values = useMemo<DataSource>(() => {
    let ans = [];
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
              color: { field: 'measureValue', type: 'quantitative', condition: {
                selection: 'dim',
                value: 'grey'
              } }
            }
          },
          {
            mark: 'rect',
            encoding: {
              x: { field: 'x', type: 'nominal' },
              y: { field: 'y', type: 'nominal' },
              color: { field: 'correlation', type: 'quantitative' }
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
      })
    }
  }, [subspaceList])
  return <div ref={chart}></div>
}

export default Subspaces;