import { analysisDimensions, getCombination } from './impurity';
import { TopKSingleField, Depth, VisualLimit } from './config';
import { entropy, normalize } from '../impurityMeasure';
import { memberCount } from '../utils'
import cluster from './cluster';

function getInsightViews(dataSource, originDimensions, measures) {
  // 1. impurity of measures based on some dimensons (single variable or depth)
  // 2. correlation matrix of measures
  // cluster of measure group
  // rank dimension
  // choose one dimension
  let dimScores = [];
  for (let dim of originDimensions) {
    const members = memberCount(dataSource, dim);
    const frequencyList = members.map(m => m[1]);
    const probabilityList = normalize(frequencyList);
    const fieldEntropy = entropy(probabilityList);
    const maxEntropy = Math.log2(members.length);
    dimScores.push([dim, fieldEntropy, maxEntropy]);
  }
  dimScores.sort((a, b) => a[1] - b[1]);
  const dimensions = dimScores.slice(0, TopKSingleField).map(d => d[0]);
  let analysisReports = analysisDimensions(dataSource, dimensions, measures).map(dimReport => {
    let sum = 0;
    for (let key in dimReport[1]) {
      sum += dimReport[1][key];
    }
    return {
      detail: dimReport,
      score: sum
    }
  });
  analysisReports.sort((a, b) => {
    return a.score - b.score;
  });
  
  // let finalReports = analysisReports.slice(0, Math.round(analysisReports.length * 0.2)).map(report => {
  let finalReports = analysisReports.map(report => {
    let matrix = report.detail[2];
    let groups = cluster({ matrix, measures });
    return {
      ...report,
      groups 
    };
  });
  console.log(finalReports)
  return finalReports

}

export default getInsightViews;
export { analysisDimensions, getCombination }