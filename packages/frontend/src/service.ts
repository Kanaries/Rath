import { DataSource, BIField, Field } from './global';
interface SuccessResult<T> {
  success: true;
  data: T;
}
interface FailResult<T> {
  success: false;
  message: string;
}

type Result<T> = SuccessResult<T> | FailResult<T>;

interface FieldAnalysisResponse {
  dimScores: Array<[string, number, number, Field]>;
  aggData: DataSource;
}
export interface FieldAnalysisResult extends FieldAnalysisResponse {
  newDimensions: string[];
}
export async function fieldsAnalysisService (cleanData: DataSource, dimensions: string[], measures: string[]): Promise<FieldAnalysisResult> {
  const res = await fetch('//localhost:8000/api/service/fieldsAnalysis', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      dataSource: cleanData,
      dimensions,
      measures
    })
  });
  const result: Result<FieldAnalysisResponse> = await res.json();
  if (result.success === true) {
    const { dimScores, aggData } = result.data;
    const newDimensions = dimScores.map(dim => dim[0]).filter(dim => !measures.includes(dim));
    return {
      dimScores,
      aggData,
      newDimensions
    }
  } else {
    throw new Error('fieldsAnalysisService failed' + result.message);
  }
}
export interface View {
  groups: string[][];
  detail: [string[], any, number[][]];
  score: number;
}

export async function getInsightViewsService (aggData: DataSource, newDimensions: string[], measures: string[]): Promise<View[]> {
  const res = await fetch('//localhost:8000/api/service/getInsightViews', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      dataSource: aggData,
      dimensions: newDimensions,
      measures
    })
  });
  const result: Result<View[]> = await res.json();
  if (result.success === true) {
    const views = result.data;
    return views;
  } else {
    throw new Error('getInsightView service fail' + result.message);
  }
}
