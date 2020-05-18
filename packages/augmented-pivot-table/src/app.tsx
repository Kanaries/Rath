import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Insight } from 'visual-insights';
import {
  ToolBar,
  AsyncPivotChart,
  DragableFields,
  Aggregators,
  DataSource,
  VisType,
  DraggableFieldState,
  Field,
  AggNodeConfig,
} from "pivot-chart";
import { TitanicCubeService, getTitanicData } from "./service";
import { QueryPath, queryCube } from "pivot-chart/build/utils";
import { ViewSpace } from "visual-insights/build/esm/insights/dev";

const initDraggableState: DraggableFieldState = {
  fields: [],
  rows: [],
  columns: [],
  measures: [],
};

function AsyncApp() {
  const [data, setData] = useState<DataSource>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [recMess, setRecMess] = useState<string>('');
  const [fstate, setFstate] = useState<DraggableFieldState>(initDraggableState);
  const [visType, setVisType] = useState<VisType>("number");
  const [aggNodeConfig, setAggNodeConfig] = useState<AggNodeConfig>({
    row: false,
    column: false,
  });

  useEffect(() => {
    const { dataSource, dimensions, measures } = getTitanicData();
    setData(dataSource);
    const fs: Field[] = [...dimensions, ...measures].map((f: string) => ({
      id: f,
      name: f,
    }));
    setFields(fs);
  }, []);
  const measures = useMemo(
    () =>
      fstate["measures"].map((f) => ({
        ...f,
        aggregator:
          Aggregators[(f.aggName || "sum") as keyof typeof Aggregators],
        minWidth: 100,
        formatter: f.id === "Survived" && ((val: any) => `${val} *`),
      })),
    [fstate["measures"]]
  );
  const cubeQuery = useCallback(async (path: QueryPath, measures: string[]) => {
    return TitanicCubeService(
      path.map((p) => p.dimCode),
      measures
    );
  }, []);
  useEffect(() => {
    const { dataSource, dimensions, measures } = getTitanicData();
    const dMatrix = Insight.Subspace.getDimCorrelationMatrix(dataSource, dimensions);
    const mMatrix = Insight.Subspace.getMeaCorrelationMatrix(dataSource, measures);
    let result = Insight.Subspace.getRelatedVertices(
      dMatrix,
      dimensions,
      [...fstate["rows"], ...fstate["columns"]].map((d) => d.id)
    );
    interface ViewSpaceWithCor extends ViewSpace {
      corValue: number;
    }
    const viewSpaces: ViewSpaceWithCor[] = [];
    for (let recDim of result) {
        const dimsInView = [...fstate["rows"], ...fstate["columns"]]
          .map((d) => d.id)
          .concat(recDim.field);
        viewSpaces.push({
          dimensions: dimsInView,
          measures: fstate['measures'].map(m => m.id),
          corValue: recDim.corValue
        })
      }
    result = result.filter(r => r.corValue >= 0.5);
    (async function () {
      const tmpCubePool = new Map();
      console.log('viewSpace', viewSpaces)
      for (let view of viewSpaces) {
          const viewData = await cubeQuery(
            view.dimensions.map((d) => ({ dimCode: d, dimValue: "*" })),
            fstate["measures"].map((m) => m.id)
          );
          tmpCubePool.set(view.dimensions.join("=;="), viewData);
      }
      let spaces = await Insight.getIntentionSpaces(tmpCubePool, viewSpaces, Insight.IntentionWorkerCollection.init());
      spaces.forEach(space => {
        let target = viewSpaces.find(v => v.dimensions.join('-') === space.dimensions.join('-'));
        let corVal = target ? target.corValue : 0;
        space.score = space.impurity / (space.significance * corVal);
      })
      spaces.sort((a, b) => a.score - b.score);
      console.log('rec dimeniosn:', spaces.map(s => s.dimensions))
      const choosenDimensions = [...fstate["rows"], ...fstate["columns"]].map(d => d.id);
      setRecMess(spaces.slice(0, 1).map((s) => s.dimensions.filter(d => !choosenDimensions.includes(d))).join(', '));
    })();
    
    console.log('recommaned', dMatrix, result);
  }, [fstate['rows'], fstate['columns'], fstate['measures']])
  return (
    <div>
      <DragableFields
        onStateChange={(state) => {
          setFstate(state);
        }}
        fields={fields}
      />
      <ToolBar
        visType={visType}
        onVisTypeChange={(type) => {
          setVisType(type);
        }}
        showAggregatedNode={aggNodeConfig}
        onShowAggNodeChange={(value) => {
          setAggNodeConfig(value);
        }}
      />
      recommaned next dimension: {recMess}
      {/* <PivotChart visType={visType} dataSource={data} rows={fstate['rows']} columns={fstate['columns']} measures={measures} /> */}
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
        measures={measures}
      />
      {/* <AsyncPivotChart
      measures={[{ id: 'Survived', name: 'survived', aggName: 'sum' }]}
      rows={[{ id: 'Embarked', name: 'embarked' }]}
      columns={[{ id: 'Sex', name: 'sex' }]}
      visType="number"
      async
      cubeQuery={cubeQuery}
      defaultExpandedDepth={{
        rowDepth: 1,
        columnDepth: 1
      }}
    /> */}
    </div>
  );
}

export default AsyncApp;
