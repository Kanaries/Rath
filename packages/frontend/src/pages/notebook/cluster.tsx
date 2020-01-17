import React, { useEffect, useMemo, useRef } from 'react';
import { Cluster } from 'visual-insights';
import { useGlobalState } from '../../state';
import embed from 'vega-embed';
// cluster should be used for small graph because the number of measure is limited. 
// Browser may be more likely crashed by other algorithm or data structure or memory used in the whole analysis pipline.
/**
 * adjMatrix and measures share a common index system;
 */
interface ClusterBoardProps {
  adjMatrix: number[][];
  measures: string[];
  onFocusGroup: (measuresInView: string[]) => void;
}

interface VegaEdge {
  source: number | string;
  target: number | string;
  value: number;
  inCutEdge: boolean;
}
interface VegaNode {
  name: string;
  index: number;
  value: number;
  group: number;
}
interface TreeData { 
  nodes: VegaNode[];
  edges: VegaEdge[]
}
const ClusterBoard: React.FC<ClusterBoardProps> = (props) => {
  const { adjMatrix, measures, onFocusGroup } = props;
  const [state, ] = useGlobalState();
  const chart = useRef<HTMLDivElement>(null);
  // const groups = useMemo<string[][]>(() => {
  //   return clusterMeasures({
  //     matrix: adjMatrix,
  //     measures,
  //   })
  // }, [adjMatrix, measures]);
  const clusterResult = useMemo(() => {
    /**
     * todo: 
     * maxGroupNumber = the measures length / max visual channel for measure.
     */
    let { edgesInMST, groups } = Cluster.kruskalWithFullMST(adjMatrix, state.maxGroupNumber);
    return { edgesInMST, groups }
  }, [adjMatrix, state.maxGroupNumber])
  const treeData = useMemo<TreeData>(() => {
    let { edgesInMST, groups } = clusterResult;
    const edges: VegaEdge[] = edgesInMST.map(edge => {
      return {
        source: edge[0][0],
        target: edge[0][1],
        value: 1 / edge[1],
        inCutEdge: edge[2]
      }
    });
    const nodes: VegaNode[] = [];
    for (let i = 0; i < groups.length; i++) {
      nodes.push({
        name: measures[i],
        index: i,
        value: 1,
        group: groups[i]
      })
    }
    return {
      nodes,
      edges
    }
  }, [measures, clusterResult])
  useEffect(() => {
    if (chart.current && measures.length > 0) {
      embed(chart.current, {
        "$schema": "https://vega.github.io/schema/vega/v5.json",
        "width": 700,
        "height": 500,
        "padding": 0,
        "autosize": "none",
      
        "signals": [
          { "name": "cx", "update": "width / 2" },
          { "name": "cy", "update": "height / 2" },
          {
            "description": "State variable for active node fix status.",
            "name": "fix", "value": false,
            "on": [
              {
                "events": "text:mouseout[!event.buttons], window:mouseup",
                "update": "false"
              },
              {
                "events": "text:mouseover",
                "update": "fix || true"
              },
              {
                "events": "[text:mousedown, window:mouseup] > window:mousemove!",
                "update": "xy()",
                "force": true
              }
            ]
          },
          {
            "description": "Graph node most recently interacted with.",
            "name": "node", "value": null,
            "on": [
              {
                "events": "text:mouseover",
                "update": "fix === true ? item() : node"
              }
            ]
          },
          {
            "description": "Flag to restart Force simulation upon data changes.",
            "name": "restart", "value": false,
            "on": [
              {"events": {"signal": "fix"}, "update": "fix && fix.length"}
            ]
          }
        ],
      
        "data": [
          {
            "name": "node-data",
            values: treeData.nodes,
          },
          {
            "name": "link-data",
            values: treeData.edges
          }
        ],
      
        "scales": [
          {
            "name": "color",
            "type": "ordinal",
            "domain": {"data": "node-data", "field": "group"},
            "range": {"scheme": "tableau20"}
          },
          {
            "name": "colorEdge",
            "type": "quantize",
            "domain": {"data": "link-data", "field": "value"},
            "range": {"scheme": "viridis"}
          }
        ],
      
        "marks": [
          {
            "name": "nodes",
            "type": "text",
            "zindex": 1,
      
            "from": {"data": "node-data"},
            "on": [
              {
                "trigger": "fix",
                "modify": "node",
                "values": "fix === true ? {fx: node.x, fy: node.y} : {fx: fix[0], fy: fix[1]}"
              },
              {
                "trigger": "!fix",
                "modify": "node", "values": "{fx: null, fy: null}"
              }
            ],
      
            "encode": {
              "enter": {
                "fill": {"scale": "color", "field": "group"},
                "text": {"field": "name"},
                "fontSize": {"value": 14},
                "fontWeight": {"value": 600}
              },
              "update": {
                "cursor": {"value": "pointer"}
              }
            },
      
            "transform": [
              {
                "type": "force",
                "iterations": 300,
                "restart": {"signal": "restart"},
                "signal": "force",
                "forces": [
                  {"force": "center", "x": {"signal": "cx"}, "y": {"signal": "cy"}},
                  {"force": "collide" },
                  {"force": "nbody" },
                  {"force": "link", "links": "link-data" }
                ]
              }
            ]
          },
          {
            "type": "path",
            "from": {"data": "link-data"},
            "interactive": false,
            "encode": {
              "update": {
                "stroke": {
                  "scale": "colorEdge",
                  "field": "value"
                },
                "strokeWidth": {"value": 0.8},
                "opacity": {"value": 0.5}
              },
            },
            "transform": [
              {
                "type": "linkpath",
                "require": {"signal": "force"},
                "shape": "line",
                "sourceX": "datum.source.x", "sourceY": "datum.source.y",
                "targetX": "datum.target.x", "targetY": "datum.target.y"
              }
            ]
          }
        ]
      }).then(res => {
        res.view.addEventListener('click', function (e, item) {
          if (item) {
            let record = item.datum;
            let group = record.group;
            let measuresInView = measures.filter((mea, index) => {
              return clusterResult.groups[index] === group
            });
            onFocusGroup(measuresInView);
          }
        })
      })
    }
  }, [treeData, measures, clusterResult.groups, onFocusGroup])
  return <div ref={chart}>
  </div>
}

export default ClusterBoard;