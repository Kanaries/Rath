import { COUNT_FIELD_ID } from '../constants';
import { Record, Filters, IMutField, IRow } from '../interfaces';
interface NRReturns {
    normalizedData: Record[];
    maxMeasures: Record;
    minMeasures: Record;
    totalMeasures: Record
}
function normalizeRecords(dataSource: Record[], measures: string[]): NRReturns {
    const maxMeasures: Record = {};
    const minMeasures: Record = {};
    const totalMeasures: Record = {};
    measures.forEach(mea => {
        maxMeasures[mea] = -Infinity;
        minMeasures[mea] = Infinity;
        totalMeasures[mea] = 0;
    })
    dataSource.forEach(record => {
        measures.forEach(mea => {
            maxMeasures[mea] = Math.max(record[mea], maxMeasures[mea])
            minMeasures[mea] = Math.min(record[mea], minMeasures[mea])
        })
    })
    const newData: Record[] = [];
    dataSource.forEach(record => {
        const norRecord: Record = { ... record };
        measures.forEach(mea => {
            // norRecord[mea] = norRecord[mea] - minMeasures[mea]
            totalMeasures[mea] += Math.abs(norRecord[mea]);
        })
        newData.push(norRecord)
    })
    newData.forEach(record => {
        measures.forEach(mea => {
            record[mea] /= totalMeasures[mea];
        })
    })
    return {
        normalizedData: newData,
        maxMeasures,
        minMeasures,
        totalMeasures
    }
}

function normalize2PositiveRecords(dataSource: Record[], measures: string[]): NRReturns {
  const maxMeasures: Record = {};
  const minMeasures: Record = {};
  const totalMeasures: Record = {};
  measures.forEach((mea) => {
    maxMeasures[mea] = -Infinity;
    minMeasures[mea] = Infinity;
    totalMeasures[mea] = 0;
  });
  dataSource.forEach((record) => {
    measures.forEach((mea) => {
      maxMeasures[mea] = Math.max(record[mea], maxMeasures[mea]);
      minMeasures[mea] = Math.min(record[mea], minMeasures[mea]);
    });
  });
  const newData: Record[] = [];
  dataSource.forEach((record) => {
    const norRecord: Record = { ...record };
    measures.forEach((mea) => {
      norRecord[mea] = norRecord[mea] - minMeasures[mea]
      totalMeasures[mea] += norRecord[mea];
    });
    newData.push(norRecord);
  });
  newData.forEach((record) => {
    measures.forEach((mea) => {
      record[mea] /= totalMeasures[mea];
    //   if (isNaN(record[mea])) {
    //       record[mea] = 1
    //   }
    });
  });
  return {
    normalizedData: newData,
    maxMeasures,
    minMeasures,
    totalMeasures,
  };
}

export function checkMajorFactor(data: Record[], childrenData: Map<any, Record[]>, dimensions: string[], measures: string[]): { majorKey: string; majorSum: number } {
    const { normalizedData, maxMeasures, minMeasures, totalMeasures } = normalizeRecords(data, measures);
    let majorSum = Infinity;
    let majorKey = '';
    for (let [key, childData] of childrenData) {
        let sum = 0;
        for (let record of normalizedData ) {
            let target = childData.find(childRecord => {
                return dimensions.every(dim => record[dim] === childRecord[dim])
            })
            if (target) {
                measures.forEach(mea => {
                    let targetValue = (typeof target![mea] === 'number' && !isNaN(target![mea])) ? target![mea] : 0;
                    targetValue = (targetValue) / totalMeasures[mea]
                    sum += Math.abs(record[mea] - targetValue)
                })
            } else {
                measures.forEach(mea => {
                    sum += Math.abs(record[mea]);
                })
            }
        }
        if (sum < majorSum) {
            majorSum = sum;
            majorKey = key;
        }
    }
    majorSum /= (measures.length * 2);
    return { majorKey, majorSum };
}

export function checkChildOutlier(data: Record[], childrenData: Map<any, Record[]>, dimensions: string[], measures: string[]): { outlierKey: string; outlierSum: number } {
    // const { normalizedData, maxMeasures, minMeasures, totalMeasures } = normalize2PositiveRecords(data, measures);
    const { normalizedData, maxMeasures, minMeasures, totalMeasures } = normalizeRecords(data, measures);
    let outlierSum = -Infinity;
    let outlierKey = '';
    for (let [key, childData] of childrenData) {
        // const { normalizedData: normalizedChildData } = normalize2PositiveRecords(childData, measures);
        const { normalizedData: normalizedChildData } = normalizeRecords(childData, measures);
        let sum = 0;
        for (let record of normalizedData ) {
            let target = normalizedChildData.find(childRecord => {
                return dimensions.every(dim => record[dim] === childRecord[dim])
            })
            if (target) {
                measures.forEach(mea => {
                    let targetValue = (typeof target![mea] === 'number' && !isNaN(target![mea])) ? target![mea] : 0;
                    sum += Math.abs(record[mea] - targetValue)
                })
            } else {
                measures.forEach(mea => {
                    sum += Math.abs(record[mea]);
                })
            }
        }
        if (sum > outlierSum) {
            outlierSum = sum;
            outlierKey = key;
        }
    }
    outlierSum /= (measures.length * 2);
    return { outlierKey, outlierSum };
}
export interface IPredicate {
    key: string;
    type: 'discrete' | 'continuous';
    range: Set<any> | [number, number];
}
export function getPredicates(selection: Record[], dimensions: string[], measures: string[]): IPredicate[] {
    const predicates: IPredicate[] = [];
    dimensions.forEach(dim => {
        predicates.push({
            key: dim,
            type: 'discrete',
            range: new Set()
        })
    })
    measures.forEach(mea => {
        predicates.push({
            key: mea,
            type: 'continuous',
            range: [Infinity, -Infinity]
        })
    })
    selection.forEach(record => {
        dimensions.forEach((dim, index) => {
            (predicates[index].range as Set<any>).add(record[dim])
        })
        measures.forEach((mea, index) => {
            (predicates[index].range as [number, number])[0] = Math.min(
              (predicates[index].range as [number, number])[0],
              record[mea]
            );
            (predicates[index].range as [number, number])[1] = Math.max(
              (predicates[index].range as [number, number])[1],
              record[mea]
            );
        })
    })
    return predicates;
}

export function getPredicatesFromVegaSignals(signals: Filters, dimensions: string[], measures: string[]): IPredicate[] {
    const predicates: IPredicate[] = [];
    dimensions.forEach(dim => {
        predicates.push({
            type: 'discrete',
            range: new Set(signals[dim]),
            key: dim
        });
    });
    return predicates;
}

export function filterByPredicates(data: Record[], predicates: IPredicate[]): Record[] {
    const filterData = data.filter((record) => {
      return predicates.every((pre) => {
        if (pre.type === 'continuous') {
          return (
            record[pre.key] >= (pre.range as [number, number])[0] &&
            record[pre.key] <= (pre.range as [number, number])[1]
          );
        } else {
          return (pre.range as Set<any>).has(record[pre.key]);
        }
      });
    });
    return filterData;
}

export function applyFilters(dataSource: Record[], filters: Filters): Record[] {
    let filterKeys = Object.keys(filters);
    return dataSource.filter((record) => {
        let keep = true;
        for (let filterKey of filterKeys) {
            if (filters[filterKey].length > 0) {
                if (!filters[filterKey].includes(record[filterKey])) {
                    keep = false;
                    break;
                }
            }
        }
        return keep;
    });
}

export function extendCountField (dataSource: IRow[], fields: IMutField[]): {
    dataSource: IRow[];
    fields: IMutField[];
} {
    const nextData = dataSource.map(r => ({
        ...r,
        [COUNT_FIELD_ID]: 1
    }))
    const nextFields = fields.concat({
        fid: COUNT_FIELD_ID,
        name: '记录数',
        analyticType: 'measure',
        semanticType: 'quantitative'
    })
    return {
        dataSource: nextData,
        fields: nextFields
    }
}