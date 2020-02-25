import { NormalizedRecord, DataSource, Record } from "../../commonTypes";
import { uniformSampling } from "../../sampling";
interface ITree {
  field: string;
  value: number;
  size: number;
  left?: ITree | null;
  right?: ITree | null;
}

export class IsolationForest {
  private normalizedDataSource: NormalizedRecord[];
  public readonly dataSource: DataSource;
  public readonly dimensions: string[];
  public readonly measures: string[];
  public readonly treeNumber: number;
  public readonly sampleSize: number;
  public readonly limitHeight: number;
  public recordScoreList: number[];
  private valueSets: Array<Map<any, number> >;
  private iForest: ITree[];
  constructor (dimensions: string[], measures: string[], dataSource: DataSource, treeNumber: number = 100, Psi: number = 256) {
    this.dimensions = dimensions;
    this.measures = measures;
    this.dataSource = dataSource;
    if (dataSource.length < Psi) {
      this.treeNumber = 20;
      this.sampleSize = dataSource.length / 5;
    } else {
      this.treeNumber = treeNumber;
      this.sampleSize = Psi;
    }
    this.limitHeight = Math.ceil(Math.log2(this.sampleSize));
    this.iForest = [];
    this.normalizeDimensions();
  }
  private normalizeDimensions(): NormalizedRecord[] {
    this.normalizedDataSource = [];
    this.valueSets = [];
    this.dimensions.forEach(() => {
      this.valueSets.push(new Map());
    })
    this.dataSource.forEach(record => {
      this.dimensions.forEach((dim, index) => {
        let value = (record[dim] || 'others').toString();
        if (!this.valueSets[index].has(value)) {
          this.valueSets[index].set(value, this.valueSets[index].size);
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
    this.measures.forEach(mea => {
      normalizedRecord[mea] = record[mea];
    })
    this.dimensions.forEach((dim, index) => {
      let value = (record[dim] || 'others').toString();
      normalizedRecord[dim] = this.valueSets[index].get(value);
    })
    return normalizedRecord;
  }
  public buildIsolationTree (fields: string[], normalizedSampleData: NormalizedRecord[], depth: number): ITree {
    if (depth >= this.limitHeight || normalizedSampleData.length <= 1) {
      return null;
    } else {
      let randField = fields[Math.floor(Math.random() * fields.length) % fields.length];
      let randValue = normalizedSampleData[Math.floor(Math.random() * normalizedSampleData.length) % normalizedSampleData.length][randField];
      let leftSubData: DataSource = [];
      let rightSubData: DataSource = [];
      for (let record of normalizedSampleData) {
        if (record[randField] < randValue) {
          leftSubData.push(record)
        } else {
          rightSubData.push(record)
        }
      }
      let node: ITree = {
        field: randField,
        value: randValue,
        size: normalizedSampleData.length
      }
      node.left = this.buildIsolationTree(fields, leftSubData, depth + 1);
      node.right = this.buildIsolationTree(fields, rightSubData, depth + 1);
      return node;
    }
  }
  /**
   * average unsuccessful searches in BST (Preiss, 1999)
   * @param Psi 
   */
  public AFS(Psi: number): number {
    if (Psi > 2) return 2 * (Math.log(Psi - 1) + Math.E) - 2 * (Psi - 1) / Psi;
    if (Psi === 2) return 1;
    return 0;
  }
  
  public getPathLength (record: NormalizedRecord, iTree: ITree, pathLength: number, nodeSize: number): number {
    if (iTree === null) {
      return pathLength + this.AFS(nodeSize);
    }
    let value = record[iTree.field];
    if (value < iTree.value) {
      return this.getPathLength(record, iTree.left, pathLength + 1, iTree.size);
    } else {
      return this.getPathLength(record, iTree.right, pathLength + 1, iTree.size);
    }
  }

  public buildIsolationForest (): ITree[] {
    this.iForest = [];
    let fields = this.dimensions.concat(this.measures);
    for (let i = 0; i < this.treeNumber; i++) {
      let samples = uniformSampling(this.normalizedDataSource, this.sampleSize);
      let iTree = this.buildIsolationTree(fields, samples, 0);
      this.iForest.push(iTree);
    }
    return this.iForest;
  }
  // public evaluate (record: Record): number {

  // }
  public estimateOutierScore(): number[] {
    this.recordScoreList = [];
    this.normalizedDataSource.forEach(record => {
      let recordScore = 0;
      let avgPathLength = 0;
      this.iForest.forEach(iTree => {
        avgPathLength += this.getPathLength(record, iTree, 0, this.sampleSize);
      })
      avgPathLength /= this.iForest.length;
      recordScore = Math.pow(2, -(avgPathLength / this.AFS(this.sampleSize)));
      this.recordScoreList.push(recordScore);
    })
    return this.recordScoreList;
  }
}

