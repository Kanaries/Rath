import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Insight } from 'visual-insights';
import {
  ToolBar,
  AsyncPivotChart,
  Aggregators,
  DataSource,
  VisType,
  Field,
  AggNodeConfig,
  NestTree,
} from "pivot-chart";
import { TitanicCubeService, getTitanicData } from "./service";
import { QueryPath, queryCube, AsyncCacheCube } from "pivot-chart/build/utils";
import { ViewSpace } from "visual-insights/build/esm/insights/dev";
import DragableFields, { DraggableFieldState, RecField } from './dragableFields/index'
import { buildCubePool } from "./dragableFields/utils";
import { enumerateExpandableNode, getViewFinalScore } from "./autoPath";

const initDraggableState: DraggableFieldState = {
  fields: [],
  rows: [],
  columns: [],
  measures: [],
};
interface ViewSpaceWithCor extends ViewSpace {
  corValue: number;
}
interface Dataset {
  dataSource: DataSource;
  fields: Field[];
  dimensions: string[];
  measures: string[];
}
function AsyncApp() {
  const [dataset, setDataset] = useState<Dataset>({ dataSource: [], fields: [], dimensions: [], measures: [] });
  const [recFields, setRecFields] = useState<RecField[]>([]);
  const [fstate, setFstate] = useState<DraggableFieldState>(initDraggableState);
  const [visType, setVisType] = useState<VisType>("number");
  const [rowScoreList, setRowScoreList] = useState<Array<[QueryPath, number]>>([]);
  const [colScoreList, setColScoreList] = useState<Array<[QueryPath, number]>>([]);
  const [aggNodeConfig, setAggNodeConfig] = useState<AggNodeConfig>({
    row: false,
    column: false,
  });
  const cubeRef = useRef<AsyncCacheCube>();
  const [nestTrees, setNestTrees] = useState<{left: NestTree; top: NestTree}>({ left: null, top: null });

  const cubeQuery = useCallback(async (path: QueryPath, measures: string[]) => {
    return TitanicCubeService(
      path.map((p) => p.dimCode),
      measures
    );
  }, []);

  useEffect(() => {
    const { dataSource, dimensions, measures } = getTitanicData();
    const fields: Field[] = [...dimensions, ...measures].map((f: string) => ({
      id: f,
      name: f,
    }));
    setDataset({
      dataSource,
      fields,
      dimensions,
      measures
    });
  }, []);

  const choosenMeasures = useMemo(() => {
    // 为度量添加aggregator, formatter等配置
    return fstate.measures.map((f) => ({
      ...f,
      aggregator: Aggregators[(f.aggName || "sum") as keyof typeof Aggregators],
      minWidth: 100,
      formatter: f.id === "Survived" && ((val: any) => val),
    }));
  }, [fstate.measures]);

  useEffect(() => {
    const { dataSource, dimensions, measures } = dataset;
    if (dataSource.length === 0) return;
    const dMatrix = Insight.Subspace.getDimCorrelationMatrix(dataSource, dimensions);
    // todo: recommanded measures/aggregators
    // const mMatrix = Insight.Subspace.getMeaCorrelationMatrix(dataSource, measures);
    let result = Insight.Subspace.getRelatedVertices(
      dMatrix,
      dimensions,
      [...fstate.rows, ...fstate.columns].map((d) => d.id)
    );

    const viewSpaces: ViewSpaceWithCor[] = [];
    for (let recDim of result) {
        const dimsInView = [...fstate.rows, ...fstate.columns]
          .map((d) => d.id)
          .concat(recDim.field);
        viewSpaces.push({
          dimensions: dimsInView,
          measures: fstate.measures.map(m => m.id),
          corValue: recDim.corValue
        })
      }
    result = result.filter(r => r.corValue >= 0.5);
    (async function () {
    
      const dimensionGroups = viewSpaces.map(space => space.dimensions);
      const cubePool = await buildCubePool(dimensionGroups, measures, cubeQuery);

      let spaces = await Insight.getIntentionSpaces(cubePool, viewSpaces, Insight.IntentionWorkerCollection.init());
      spaces.forEach(space => {
        let target = viewSpaces.find(v => v.dimensions.join('-') === space.dimensions.join('-'));
        // todo: discuss whether correlation should participate in view score computation.
        // let corVal = target ? target.corValue : 0;
        space.score = space.impurity / (space.significance);
      })
      spaces.sort((a, b) => a.score - b.score);
    
      const choosenDimensions = [...fstate["rows"], ...fstate["columns"]].map(d => d.id);

      setRecFields(
        spaces
          .slice(0, 3)
          .flatMap((s) =>
            s.dimensions.filter((d) => !choosenDimensions.includes(d))
            .map(d => ({
              id: d,
              type: s.type
            }))
          )
      );
    })();
    
  }, [fstate.rows, fstate.columns, fstate.measures, dataset])

  useEffect(() => {
    console.log('nestTrees', nestTrees)
    if (nestTrees.left !== null && nestTrees.top !== null) {

      let leftStatus = {
        isEnd: false,
        count: 0,
        asyncCount: 0,
        ans: []
      };
      let topStatus = {
        isEnd: false,
        count: 0,
        asyncCount: 0,
        ans: [],
      };
      enumerateExpandableNode(nestTrees.left, fstate.rows.map(f => f.id), (path) => {
        console.log(path)
        leftStatus.count++;
        cubeRef.current.cacheQuery(path, fstate.measures.map(m => m.id))
          .then(res => {
            console.log('cube res', res)
            let cubePool = new Map();
            const viewSpace: ViewSpace = {
              dimensions: path.map(p => p.dimCode),
              measures: fstate.measures.map(m => m.id)
            }
            cubePool.set(viewSpace.dimensions.join('=;='), res)
            return Insight.getIntentionSpaces(
              cubePool,
              [viewSpace],
              Insight.IntentionWorkerCollection.init()
            );
          })
          .then(spaces => {
            leftStatus.asyncCount++;
            console.log('spaces', spaces, path.map(p => p.dimValue))
            const score = getViewFinalScore(spaces);
            leftStatus.ans.push([path, score])
            if (leftStatus.isEnd && leftStatus.count === leftStatus.asyncCount) {
              leftStatus.ans.sort((a, b) => b[1] - a[1])
              setRowScoreList(leftStatus.ans);
            }
          })
      }, () => {
        leftStatus.isEnd = true;
      });
      enumerateExpandableNode(
        nestTrees.top,
        fstate.columns.map((f) => f.id),
        (path) => {
          console.log(path);
          topStatus.count++;
          cubeRef.current
            .cacheQuery(
              path,
              fstate.measures.map((m) => m.id)
            )
            .then((res) => {
              console.log("cube res", res);
              let cubePool = new Map();
              const viewSpace: ViewSpace = {
                dimensions: path.map((p) => p.dimCode),
                measures: fstate.measures.map((m) => m.id),
              };
              cubePool.set(viewSpace.dimensions.join("=;="), res);
              return Insight.getIntentionSpaces(
                cubePool,
                [viewSpace],
                Insight.IntentionWorkerCollection.init()
              );
            })
            .then((spaces) => {
              topStatus.asyncCount++;
              console.log(
                "spaces",
                spaces,
                path.map((p) => p.dimValue)
              );
              const score = getViewFinalScore(spaces);
              topStatus.ans.push([path, score]);
              if (topStatus.isEnd && topStatus.count === topStatus.asyncCount) {
                topStatus.ans.sort((a, b) => b[1] - a[1]);
                setColScoreList(topStatus.ans);
              }
            });
        },
        () => {
          topStatus.isEnd = true;
        }
      );
    }
    
  }, [nestTrees, fstate.measures])

  const highlightList = useMemo<any[]>(() => {
    let scoreList = [...rowScoreList.slice(0, 1), ...colScoreList.slice(0, 1)];
    return scoreList.map(s => s[0].slice(0, -1).map(f => f.dimValue))
  }, [rowScoreList, colScoreList])
  console.log('high', highlightList)
  return (
    <div>
      <DragableFields
        onStateChange={(state) => {
          setFstate(state);
        }}
        highlightFields={recFields}
        fields={dataset.fields}
      />
      <ToolBar
        visType={visType}
        onVisTypeChange={(type: any) => {
          setVisType(type);
        }}
        showAggregatedNode={aggNodeConfig}
        onShowAggNodeChange={(value: any) => {
          setAggNodeConfig(value);
        }}
      />

      <AsyncPivotChart
        cubeRef={cubeRef}
        visType={visType}
        rows={fstate["rows"]}
        columns={fstate["columns"]}
        showAggregatedNode={aggNodeConfig}
        cubeQuery={cubeQuery}
        measures={choosenMeasures}
        onNestTreeChange={(left, top) => {
          setNestTrees({ left, top });
        }}
        defaultExpandedDepth={{
          rowDepth: 1,
          columnDepth: 1
        }}
        highlightPathList={highlightList}
      />
    </div>
  );
}

export default AsyncApp;
