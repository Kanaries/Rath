import { DataSource, Record, NormalizedRecord } from "../../commonTypes";
interface BaseProps {
  readonly dataSource: DataSource;
  readonly dimensions: string[];
  readonly measures: string[];
}
class Base {
  public readonly dataSource: DataSource;
  public readonly dimensions: string[];
  public readonly measures: string[];
  protected valueSets: Array<Map<any, number> >;
  protected valueParser: string[][];
  protected ranges: Array<[number, number]>;
  public normalizedDataSource: NormalizedRecord[];
  constructor (props: BaseProps) {
    const { dataSource, dimensions, measures } = props;
    this.dataSource = dataSource;
    this.dimensions = dimensions;
    this.measures = measures;
  }
  public normalize(): NormalizedRecord[] {
    this.normalizedDataSource = [];
    this.valueSets = [];
    this.valueParser = [];
    this.ranges = [];
    this.dimensions.forEach(dim => {
      this.valueSets.push(new Map());
      this.valueParser.push([]);
    })
    this.measures.forEach(() => {
      this.ranges.push([Infinity, -Infinity]);
    })
    this.dataSource.forEach(record => {
      this.dimensions.forEach((dim, index) => {
        let value = (record[dim] || 'others').toString();
        if (!this.valueSets[index].has(value)) {
          this.valueSets[index].set(value, this.valueSets[index].size);
          this.valueParser[index].push(value)
        }
      })
      this.measures.forEach((mea, index) => {
        let value = record[mea];
        if (typeof value === 'number') {
          this.ranges[index][0] = Math.min(this.ranges[index][0], value);
          this.ranges[index][1] = Math.max(this.ranges[index][1], value);
        }
      })
    })
    this.dataSource.forEach(record => {
      let normalizedRecord = this.normalizeRecord(record);
      this.normalizedDataSource.push(normalizedRecord);
    })
    return this.normalizedDataSource;
  }
  public normalizeRecord (record: Record): NormalizedRecord {
    let normalizedRecord: NormalizedRecord = {};
    this.measures.forEach((mea, index) => {
      normalizedRecord[mea] = (record[mea] - this.ranges[index][0]) / (this.ranges[index][1]  - this.ranges[index][0]);
    })
    this.dimensions.forEach((dim, index) => {
      let value = (record[dim] || 'others').toString();
      normalizedRecord[dim] = this.valueSets[index].get(value);
    })
    return normalizedRecord;
  }
}
export interface KNNProps extends BaseProps {
  K: number;
}
export class KNN extends Base {
  public K: number;
  public features: string[];
  public targets: string[];
  constructor (props: KNNProps) {
    super(props);
    const { K } = props;
    this.K = K;
    this.normalize();
  }
  public getNeighbors(targetRecord: NormalizedRecord, features: string[], weights: number[] | undefined = []): NormalizedRecord[] {
    if (weights.length !== features.length) {
      features.forEach(f => {
        weights.push(1)
      })
    }
    // let normalizedRecord = this.normalizeRecord(targetRecord);
    let dimFeatures: string[] = [];
    let meaFeatures: string[] = [];
    let dimWeights: number[] = [];
    let meaWeights: number[] = [];
    let dimSets: Set<string> = new Set(this.dimensions);
    for (let i = 0; i < features.length; i ++) {
      if (dimSets.has(features[i])) {
        dimFeatures.push(features[i]);
        dimWeights.push(weights[i])
      } else {
        meaFeatures.push(features[i]);
        meaWeights.push(weights[i]);
      }
    }
    // let legalFeatures = features.filter(f => this.measures.includes(f));
    let distances: Array<{dis: number, index: number}> = [];
    this.normalizedDataSource.forEach((record, rIndex) => {
      let dis = 0;
      meaFeatures.forEach((feature, index) => {
        dis += ((record[feature] - targetRecord[feature]) * meaWeights[index]) ** 2;
      })
      dimFeatures.forEach((feature, index) => {
        if (record[feature] !== targetRecord[feature]) {
          dis += dimWeights[index] ** 2;
        }
      })
      distances.push({
        dis,
        index: rIndex
      });
    })
    distances.sort((a, b) => {
      return a.dis - b.dis;
    });
    let ans: NormalizedRecord[] = [];
    let len = Math.min(this.K, distances.length);
    for (let i = 0; i < len; i++) {
      ans.push(this.normalizedDataSource[distances[i].index])
    }
    return ans;
  }
  public getTargetValue(targets: string[], neighbors: NormalizedRecord[]): any[] {
    let ans = [];
    targets.forEach(tar => {
      let votes: Map<any, number> = new Map();
      neighbors.forEach(nei => {
        if (!votes.has(nei[tar])) {
          votes.set(nei[tar], 0)
        }
        votes.set(nei[tar], votes.get(nei[tar]) + 1)
      })
      let mostCount = 0;
      let mostFeature = 0;
      for (let vote of votes) {
        if (vote[1] > mostCount) {
          mostCount = vote[1];
          mostFeature = vote[0];
        }
      }
      let dimIndex = this.dimensions.indexOf(tar)
      if (dimIndex > -1) {
        ans.push(this.valueParser[dimIndex][mostFeature]);
      } else {
        ans.push(mostFeature)
      }
    })
    return ans;
  }
}