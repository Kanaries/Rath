import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Insight } from 'visual-insights';
import {
  ToolBar,
  AsyncPivotChart,
  Aggregators,
  DataSource,
  VisType,
  Field,
  AggNodeConfig,
} from "pivot-chart";
import { TitanicCubeService, getTitanicData } from "./service";
import { QueryPath, queryCube } from "pivot-chart/build/utils";
import { ViewSpace } from "visual-insights/build/esm/insights/dev";
import DragableFields, { DraggableFieldState, RecField } from './dragableFields/index'
import { buildCubePool } from "./dragableFields/utils";

const initDraggableState: DraggableFieldState = {
  fields: [],
  rows: [],
  columns: [],
  measures: [],
};
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
  const [aggNodeConfig, setAggNodeConfig] = useState<AggNodeConfig>({
    row: false,
    column: false,
  });

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
    interface ViewSpaceWithCor extends ViewSpace {
      corValue: number;
    }
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
        visType={visType}
        rows={fstate["rows"]}
        columns={fstate["columns"]}
        defaultExpandedDepth={{
          rowDepth: 20,
          columnDepth: 20,
        }}
        showAggregatedNode={aggNodeConfig}
        cubeQuery={cubeQuery}
        measures={choosenMeasures}
      />

    </div>
  );
}

export default AsyncApp;
