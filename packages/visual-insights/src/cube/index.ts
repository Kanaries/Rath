// import { DataSource, Record} from "../commonTypes";
// import { Cuboid } from "./cuboid";

import { Record } from "../commonTypes";
import { StatFuncName } from "../statistics";
import { Cuboid } from "./cuboid";

// interface QueryNode {
//   dimCode: string;
//   dimValue: string
// }
// export type QueryPath = QueryNode[];

// interface CuboidNode extends Map<string, CuboidNode | Record> {}

// function contains (arr1: any[], arr2: any[]): boolean {
//   if (arr1.length < arr2.length) return false;
//   let sets = new Set(arr1);
//   for (let ele of arr2) {
//     if (!sets.has(ele)) {
//       return false;
//     }
//   }
//   return true;
// }
// // todo query path support array
// export class Cube {
//   private computeCuboid: (
//     path: QueryPath,
//     measures: string[]
//   ) => Promise<DataSource>;
//   private cuboids: Map<string, Cuboid>;
//   private inferableDistance: number;
//   public readonly holistic: boolean;
//   constructor(props: {
//     computeCuboid: (path: QueryPath, measures: string[]) => Promise<DataSource>;
//     inferableDistance?: number;
//     holistic?
//   }) {
//     this.computeCuboid = props.computeCuboid;
//     this.cuboids = new Map();
//     this.inferableDistance = props.inferableDistance ? props.inferableDistance : Infinity;
//     this.holistic = props.holistic || false;
//   }
//   /**
//    * check whether the cuboid made of given dimensions can be infered by current diemnsions.
//    * @param dimensions 
//    */
//   private isCuboidInferable (dimensions: string[]): Cuboid | null {
//     for (let cuboid of this.cuboids.values()) {
//       let distance = cuboid.dimensions.length - dimensions.length;
//       if (distance < this.inferableDistance && contains(cuboid.dimensions, dimensions)) {
//         return cuboid;
//       }
//     }
//     return null;
//   }
//   private getClosestCuboid (dimensions: string[]): Cuboid | null {
//     let minDis = Infinity;
//     let targetCuboid: Cuboid | null = null;
//     for (let cuboid of this.cuboids.values()) {
//       let distance = cuboid.dimensions.length - dimensions.length;
//       if (distance < this.inferableDistance && contains(cuboid.dimensions, dimensions)) {
//         if (distance < minDis) {
//           minDis = distance;
//           targetCuboid = cuboid;
//         }
//       }
//     }
//     return targetCuboid;
//   }
//   public async getCuboid(
//     dimSet: string[],
//     measures: string[]
//   ): Promise<Cuboid> {
//     const key = dimSet.join(";");

//     if (this.holistic) {
//       if (this.cuboids.has(key)) {
//         return this.cuboids.get(key);
//       }
//     } else {
//       let inferedCuboid = this.isCuboidInferable(dimSet);
//       if (inferedCuboid) {
//         return inferedCuboid;
//       }
//     }
//     const path: QueryPath = dimSet.map((d) => {
//       return {
//         dimCode: d,
//         dimValue: "*",
//       };
//     });
//     const cuboidDataSource = await this.computeCuboid(path, measures);
//     const cuboid = new Cuboid({
//       dimensions: dimSet,
//       dataSource: cuboidDataSource,
//     });
//     this.cuboids.set(key, cuboid);
//     return cuboid;
//   }
// }

// // todo
// // 至少返回的因该是一个DataFrame，而不应该是当前cuboid粒度的明细。
// // case: 第一个请求的cuboid是明细粒度，则

const CUBOID_KEY_SPLITOR = '_join_';
interface ICube {
    dimensions: string[];
    measures: string[];
    dataSource: Record[];
    ops: StatFuncName[];
}
export class Cube implements ICube {
    public dimensions: string[];
    public measures: string[];
    public dataSource: Record[];
    public ops: StatFuncName[];
    private cuboids: Map<string, Cuboid>;
    private dimOrder: Map<string, number>;
    public constructor (props: ICube) {
        const { dimensions, measures, dataSource, ops } = props;
        this.dimensions = dimensions;
        this.measures = measures;
        this.dataSource = dataSource;
        this.ops = ops;
        this.dimOrder = new Map();
        dimensions.forEach((dim, i) => {
            this.dimOrder.set(dim, i);
        })
        this.cuboids = new Map();
    }
    // public contains(dimensions: string[]): boolean {
    //     if (dimensions.length > )
    // }
    public sortDimension(dimensions: string[]): string[] {
        const orderedDims = [...dimensions];
        orderedDims.sort((d1, d2) => {
            return this.dimOrder.get(d1) - this.dimOrder.get(d2)
        })
        return orderedDims;
    }
    public getCuboid (dimensions: string[]): Cuboid {
        const orderedDims = this.sortDimension(dimensions);
        const dimKey = orderedDims.join(CUBOID_KEY_SPLITOR);
        // this.cuboids.get(dimKey)
        if (this.cuboids.has(dimKey)) {
            // console.log('target cached!!!')
            return this.cuboids.get(dimKey);
        }
        // does not get cuboid
        let currDimSet = new Set(dimensions);
        const existingParentKeys: string[] = [];
        const nullParentKeys: string[] = [];
        for (let dim of this.dimensions) {
            if (!currDimSet.has(dim)) {
                // use insert O(n) instead of sort O(nlogn)
                const parentDimensions = this.sortDimension([...orderedDims, dim]);
                const parentKey = parentDimensions.join(CUBOID_KEY_SPLITOR);
                if (this.cuboids.has(parentKey)) existingParentKeys.push(parentKey);
                else {
                    nullParentKeys.push(parentKey);
                }
            }
        }
        let minCost = this.dataSource.length;
        let minCuboidKey = this.dimensions.join(CUBOID_KEY_SPLITOR);
        if (existingParentKeys.length > 0) {
            for (let key of existingParentKeys) {
                const pCuboid = this.cuboids.get(key);
                if (pCuboid.size < minCost) {
                    minCost = pCuboid.size;
                    minCuboidKey = key;
                }
            }
        } else if (nullParentKeys.length > 0) {
            minCuboidKey = nullParentKeys[0];
        }

        const parentCuboid = this.getCuboid(minCuboidKey.split(CUBOID_KEY_SPLITOR));
        // console.log('based on parents cube: ', minCuboidKey)
        // todo: 递归构建相关的cuboid，可能要依赖field dict来判断递归的路径
        let cuboid = new Cuboid({
          dimensions,
          measures: this.measures,
          ops: this.ops,
        })
        cuboid.setData(parentCuboid.state);
        return cuboid;
    }
    public buildBaseCuboid(): Cuboid {
        let baseCuboid = new Cuboid({
            dimensions: this.dimensions,
            measures: this.measures,
            ops: this.ops
        });
        baseCuboid.setData(this.dataSource)
        this.cuboids.set(this.dimensions.join(CUBOID_KEY_SPLITOR), baseCuboid);
        return baseCuboid;
    }
    public get baseCuboid () {
        const baseKey = this.dimensions.join(CUBOID_KEY_SPLITOR);
        if (!this.cuboids.has(baseKey)) {
            return this.buildBaseCuboid()
        }
        return this.cuboids.get(baseKey);
    }
}