import { Record } from "../../commonTypes";
import { IField, FieldDictonary, IFieldSummary, IInsightSpace, InsightWorker } from "./interfaces";
import { getFieldsSummary } from "./fieldSummary";
import { DataGraph } from "./dataGraph";
import { Cube } from "../../cube";
import { StatFuncName, getCombination, normalize, linearMapPositive, entropy } from "../../statistics";
import { InsightWorkerCollection } from "./workerCollection";
import { specification, IFieldSummaryInVis } from './specification/encoding';

export interface ViewSpace {
    dimensions: string[];
    measures: string[];
}

interface ConstRange {
    MAX: number;
    MIN: number;
}
export class VIEngine {
           public dataSource: Record[];
           private _fieldKeys: string[];
           private _dimensions: string[];
           private _measures: string[];
           private _fields: IFieldSummary[];
           private fieldDictonary: FieldDictonary;
           public dataGraph: DataGraph;
           public cube: Cube;
           public workerCollection: InsightWorkerCollection;
           public subSpaces: ViewSpace[];
           public insightSpaces: IInsightSpace[];
           /**
            * number of dimensions appears in a view.
            */
           public DIMENSION_NUM_IN_VIEW: ConstRange = {
               MAX: 3,
               MIN: 1,
           };
           /**
            * number of measures appears in a view.
            */
           public MEASURE_NUM_IN_VIEW: ConstRange = {
               MAX: 3,
               MIN: 1,
           };
           public constructor() {
               this.cube = null;
               this.workerCollection = InsightWorkerCollection.init();
           }
           public setDataSource(dataSource: Record[]) {
               this.dataSource = dataSource;
               return this;
           }
           public get fields() {
               return this._fields;
           }
           public set fields(fields: IFieldSummary[]) {
               this._fields = fields;
               this._dimensions = fields.filter((f) => f.analyticType === "dimension").map((f) => f.key);
               this._measures = fields.filter((f) => f.analyticType === "measure").map((f) => f.key);
           }
           public get dimensions() {
               return this._dimensions;
           }
           // public set dimensions (dimensions: string[]) {
           //     this._dimensions = dimensions;
           //     this._fields.forEach(f => {
           //         if (f.analyticType !== 'dimension' && dimensions.includes(f.key)) {
           //             f.analyticType = 'dimension';
           //         }
           //     })
           // }
           public setDimensions(dimensions: string[]) {
               this._dimensions = dimensions;
               this._fields.forEach((f) => {
                   if (f.analyticType !== "dimension" && dimensions.includes(f.key)) {
                       f.analyticType = "dimension";
                   }
               });
               return this;
           }
           public get measures() {
               return this._measures;
           }
           // public set measures (measures: string[]) {
           //     this._measures = measures;
           //     this._fields.forEach(f => {
           //         if (f.analyticType !== 'measure' && measures.includes(f.key)) {
           //             f.analyticType = 'measure';
           //         }
           //     })
           // }
           public setMeasures(measures: string[]) {
               this._measures = measures;
               this._fields.forEach((f) => {
                   if (f.analyticType !== "measure" && measures.includes(f.key)) {
                       f.analyticType = "measure";
                   }
               });
               return this;
           }
           public setFieldKeys(keys: string[]) {
               this._fieldKeys = keys;
               return this;
           }
           public buildfieldsSummary() {
               const { fields, dictonary } = getFieldsSummary(this._fieldKeys, this.dataSource);
               if (this.dimensions && this.measures) {
                   fields.forEach((f) => {
                       if (this.dimensions.includes(f.key)) {
                           f.analyticType = "dimension";
                       } else {
                           f.analyticType = "measure";
                       }
                   });
               }
               this.fields = fields;
               this.fieldDictonary = dictonary;
               return this;
           }
           public buildGraph() {
               this.dataGraph = new DataGraph(this.dataSource, this.dimensions, this.measures);
               return this;
           }
           public buildCube() {
               const { measures, dataSource, dataGraph, dimensions } = this;
               const ops: StatFuncName[] = measures.map((m) => "sum");
               const cube = new Cube({
                   dimensions,
                   measures,
                   dataSource,
                   ops,
               });
               cube.buildBaseCuboid();
               dataGraph.DClusters.forEach((group) => {
                   cube.getCuboid(group);
               });
               this.cube = cube;
               return this;
           }
           public clusterFields() {
               this.dataGraph.clusterDGraph(this.dataSource);
               this.dataGraph.clusterMGraph(this.dataSource);
               return this;
           }
           private static getCombinationFromClusterGroups(groups: string[][], limitSize: ConstRange): string[][] {
               let fieldSets: string[][] = [];
               for (let group of groups) {
                   let combineFieldSet: string[][] = getCombination(group, limitSize.MIN, limitSize.MAX);
                   fieldSets.push(...combineFieldSet);
               }
               return fieldSets;
           }
           public buildSubspaces(
               DIMENSION_NUM_IN_VIEW: ConstRange = this.DIMENSION_NUM_IN_VIEW,
               MEASURE_NUM_IN_VIEW: ConstRange = this.MEASURE_NUM_IN_VIEW
           ): VIEngine {
               // todo: design when to compute clusters.
               const dimensionGroups = this.dataGraph.DClusters;
               const measureGroups = this.dataGraph.MClusters;
               // const dimensionSets = VIEngine.getCombinationFromClusterGroups(
               //     dimensionGroups,
               //     MAX_DIMENSION_NUM_IN_VIEW
               // );

               const measureSets = VIEngine.getCombinationFromClusterGroups(measureGroups, MEASURE_NUM_IN_VIEW);

               // const subspaces = crossGroups(dimensionSets, measureSets);
               const subspaces: ViewSpace[] = [];
               for (let group of dimensionGroups) {
                   const dimSets = getCombination(group, DIMENSION_NUM_IN_VIEW.MIN, DIMENSION_NUM_IN_VIEW.MAX);
                   for (let dims of dimSets) {
                       for (let meas of measureSets) {
                           subspaces.push({
                               dimensions: dims,
                               measures: meas,
                           });
                       }
                   }
               }
               this.subSpaces = subspaces;
               return this;
           }
           public static getSpaceImpurity(dataSource: Record[], dimensions: string[], measures: string[]): number {
               let imp = 0;
               for (let mea of measures) {
                   let fL = dataSource.map((r) => r[mea]);
                   let pL = normalize(linearMapPositive(fL));
                   let value = entropy(pL);
                   imp += value;
               }
               imp /= measures.length;
               return imp;
           }
           public async insightExtraction(viewSpaces: ViewSpace[] = this.subSpaces): Promise<IInsightSpace[]> {
               const context = this;
               let ansSpace: IInsightSpace[] = [];
               for (let space of viewSpaces) {
                //    const t1 = performance.now();
                   const { dimensions, measures } = space;

                   // console.log("worker key", key, this.cubePool.has(key));
                   let cube = context.cube;
                   let cuboid = cube.getCuboid(dimensions);
                   const aggData = cuboid.state;
                //    const t2 = performance.now();
                   const imp = VIEngine.getSpaceImpurity(aggData, dimensions, measures);
                   const jobPool = [];

                   this.workerCollection.each((iWorker, name) => {
                       // tslint:disable-next-line: no-shadowed-variable
                       const job = async (iWorker: InsightWorker, name: string) => {
                           try {
                               let iSpace = await iWorker(
                                   aggData,
                                   dimensions,
                                   measures,
                                   context.fieldDictonary,
                                   context
                               );
                               if (iSpace !== null) {
                                   iSpace.type = name;
                                   iSpace.impurity = imp;
                                   ansSpace.push(iSpace);
                               }
                           } catch (error) {
                               console.error("worker failed", { dimensions, measures, aggData }, error);
                           }
                       };
                       jobPool.push(job(iWorker, name));
                   });
                   await Promise.all(jobPool);
                //    const t3 = performance.now();
                //    const per = Math.round(((t3 - t2) / (t3 - t1)) * 100);
               }
               context.insightSpaces = ansSpace;
               return ansSpace;
           }
           // todo:
           public setInsightScores () {
               const insightSpaces = this.insightSpaces;
               insightSpaces.forEach(space => {
                   space.score = space.impurity / space.significance
               })
               return this;
           }
           private getFieldInfoInVis(insightSpace: IInsightSpace): IFieldSummaryInVis[] {
               const fieldsInVis: IFieldSummaryInVis[] = [];
               const cube = this.cube;
               const fieldDictonary = this.fieldDictonary;
               const { dimensions, measures } = insightSpace;
               dimensions.forEach((dim) => {
                   const aggData = cube.getCuboid([dim]).state;
                   let imp = 0;
                   measures.forEach((mea) => {
                       let fL = aggData.map((r) => r[mea]);
                       let pL = normalize(linearMapPositive(fL));
                       let value = entropy(pL);
                       imp += value;
                   });
                   fieldsInVis.push({
                       ...fieldDictonary.get(dim),
                       impurity: imp,
                   });
               });
               const dAggData = cube.getCuboid(dimensions).state;
               measures.forEach((mea) => {
                   let fL = dAggData.map((r) => r[mea]);
                   let pL = normalize(linearMapPositive(fL));
                   let value = entropy(pL);
                   fieldsInVis.push({
                       ...fieldDictonary.get(mea),
                       impurity: value,
                   });
               });
               return fieldsInVis;
           }
           public specification(insightSpace: IInsightSpace) {
               const { dimensions } = insightSpace;
               const fieldsInVis = this.getFieldInfoInVis(insightSpace);
               const dataView = this.cube.getCuboid(dimensions).state;
               return specification(fieldsInVis, dataView);
           }
       }
