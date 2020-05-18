import titanic from "../../visual-insights/test/dataset/titanic.json";

import { DataSource, Record } from "pivot-chart";
// import aggregate from 'cube-core';
export function getTitanicData() {
  const { dataSource, config } = titanic;
  const { Dimensions: dimensions, Measures: measures } = config;
  return {
    dataSource,
    dimensions,
    measures,
  };
}

const { dataSource, dimensions, measures } = getTitanicData();
function aggregate(
  dataSource: DataSource,
  dimensions: string[],
  measures: string[]
): DataSource {
  let map = new Map<string, Record>();
  for (let record of dataSource) {
    let unionDims = dimensions.map((d) => record[d]);
    let unionKey = unionDims.join("-");
    if (!map.has(unionKey)) {
      let ans: Record = {};
      measures.forEach((mea) => {
        ans[mea] = 0;
      });
      dimensions.forEach((dim) => {
        ans[dim] = record[dim];
      });
      map.set(unionKey, ans);
    }
    let ans = map.get(unionKey);
    measures.forEach((mea) => {
      ans[mea] += record[mea];
    });
  }
  return [...map.values()];
}
export function TitanicCubeService(
  dimensions: string[],
  meaList: string[]
): Promise<any[]> {
  return new Promise((resolve, reject) => {
    try {
      console.log("[service]", dimensions);
      const result = aggregate(dataSource, dimensions, measures);
      resolve(result);
      setTimeout(() => {
        resolve(result);
      }, Math.round(Math.random() * 500));
      // console.log("[service]", result);
    } catch (error) {
      console.error("error occur");
      reject(error);
    }
  });
}
