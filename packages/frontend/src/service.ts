import { DataSource,  Field, FieldType, OperatorType } from './global';
let server = '//lobay.moe:8443';

if (process.env.NODE_ENV !== 'production') {
  console.log('using dev server');
  server = '//localhost:8000';
}

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
  const res = await fetch(server + '/api/service/fieldsAnalysis', {
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
  const res = await fetch(server + '/api/service/getInsightViews', {
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
/**
 * statistic description for a field
 */
export interface FieldSummary {
  fieldName: string;
  entropy: number;
  maxEntropy: number;
  distribution: Array<{ memberName: string; count: number }>
  type: FieldType
}
export async function getFieldsSummaryService (dataSource: DataSource, fields: string[] | Field[]): Promise<FieldSummary[] | undefined> {
  try {
    const res = await fetch(server + '/api/service/fieldsSummary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        dataSource,
        fields
      })
    })
    const result: Result<FieldSummary[]> = await res.json();
    if (result.success === true) {
      const fieldSummaryList = result.data;
      return fieldSummaryList
    } else {
      throw new Error('[fields summary failed]' + result.message)
    }
  } catch (error) {
    console.error(error)
  }
}

interface GroupFieldsResponse {
  groupedData: DataSource;
  newFields: Field[];
  fields: Field[];
}
export async function getGroupFieldsService (dataSource: DataSource, fields: Field[]): Promise<GroupFieldsResponse | undefined> {
  try {
    const res = await fetch(server + '/api/service/groupFields', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        dataSource,
        fields
      })
    })
    const result: Result<GroupFieldsResponse> = await res.json();
    if (result.success === true) {
      const { groupedData, newFields, fields } = result.data;
      return { groupedData, newFields, fields }
    } else {
      throw new Error('[group fields failed]' + result.message)
    }
  } catch (error) {
    console.error(error)
  }
}

export interface Subspace {
  score: number;
  dimensions: string[];
  measures: Array<{name: string; value: number}>;
  correlationMatrix: number[][];
}
export async function combineFieldsService (dataSource: DataSource, dimensions: string[], measures: string[], operator: OperatorType): Promise<Subspace[] | undefined> {
  try {
    const res = await fetch(server + '/api/service/combineFields', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        dataSource,
        dimensions,
        measures,
        operator
      })
    })
    const result: Result<Subspace[]> = await res.json();
    if (result.success === true) {
      const subspaceList = result.data;
      return subspaceList
    } else {
      throw new Error('[combine fields failed]' + result.message)
    }
  } catch (error) {
    console.error(error)
  }
}

export interface ViewCombinedSpace {
  dimensions: string[];
  measures: Array<{name: string; value: number}>;
  matrix: number[][];
}

export interface ViewSpace {
  index: number;
  dimensions: string[];
  measures: string[];
  score: number;
}

export async function clusterMeasures (maxGroupNumber: number, combinedSpaces: ViewCombinedSpace[]): Promise<ViewSpace[]> {
  let viewSpaces: ViewSpace[] = [];
  try {
    const res = await fetch(server + '/api/service/clusterMeasures', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        maxGroupNumber,
        spaces: combinedSpaces
      })
    });
    const result: Result<ViewSpace[]> = await res.json();
    if (result.success === true) {
      viewSpaces = result.data.map((v, i) => {
        return {
          ...v,
          index: i
        }
      });
    } else {
      throw new Error('[cluster measures]' + result.message)
    }
  } catch (error) {
    console.error(error)
  }
  return viewSpaces;
}