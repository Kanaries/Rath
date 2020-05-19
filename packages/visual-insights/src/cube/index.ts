import { DataSource, Record} from "../commonTypes";

interface QueryNode {
  dimCode: string;
  dimValue: string
}
export type QueryPath = QueryNode[];

interface CuboidNode extends Map<string, CuboidNode | Record> {}

export class Cuboid {
  public readonly dimensions: string[];
  public readonly dataSource: DataSource;
  // public readonly measures: string[];
  private tree: CuboidNode;
  constructor(props: { dimensions: string[]; dataSource: DataSource }) {
    const { dimensions, dataSource } = props;
    this.dimensions = dimensions;
    this.dataSource = dataSource;
    this.tree = new Map();
    this.buildCuboid(dataSource);
  }
  private insertNode(node: CuboidNode, record: Record, depth: number) {
    let dim = this.dimensions[depth];
    let dimValue = record[dim] || "";
    if (depth >= this.dimensions.length - 1) {
      node.set(dimValue, record);
      return;
    }
    if (!node.has(dimValue)) {
      node.set(dimValue, new Map());
    }
    this.insertNode(node.get(dimValue) as CuboidNode, record, depth + 1);
  }

  public buildCuboid(dataSource: DataSource) {
    let len = dataSource.length;
    for (let i = 0; i < len; i++) {
      this.insertNode(this.tree, dataSource[i], 0);
    }
  }
  public get(path: QueryPath) {
    let adjustPath: string[] = [];
    for (let dim of this.dimensions) {
      let value = path.find((p) => p.dimCode === dim);
      adjustPath.push(typeof value !== "undefined" ? value.dimValue : "*");
    }
    return this.query(this.tree, adjustPath, 0);
  }
  private query(node: CuboidNode, path: string[], depth: number): Record[] {
    let value = path[depth] || "";
    if (depth >= this.dimensions.length - 1) {
      if (value === "*") return [...node.values()];
      return node.has(value) ? [node.get(value)] : [];
    }
    let children: Record[] = [];
    if (value === "*") {
      for (let child of node) {
        let childRecords = this.query(child[1] as CuboidNode, path, depth + 1);
        for (let record of childRecords) {
          children.push(record);
        }
      }
    } else {
      let child = node.get(value);
      if (child) {
        let childRecords = this.query(child as CuboidNode, path, depth + 1);
        for (let record of childRecords) {
          children.push(record);
        }
      }
    }
    return children;
  }
}
// todo query path support array
export class DynamicCube {
  private computeCuboid: (
    path: QueryPath,
    measures: string[]
  ) => Promise<DataSource>;
  private cuboids: Map<string, Cuboid>;
  constructor(props: {
    computeCuboid: (path: QueryPath, measures: string[]) => Promise<DataSource>;
  }) {
    this.computeCuboid = props.computeCuboid;
    this.cuboids = new Map();
  }
  public async getCuboid(
    dimSet: string[],
    measures: string[]
  ): Promise<Cuboid> {
    const key = dimSet.join(";");
    if (this.cuboids.has(key)) {
      return this.cuboids.get(key);
    }
    const path: QueryPath = dimSet.map((d) => {
      return {
        dimCode: d,
        dimValue: "*",
      };
    });
    const cuboidDataSource = await this.computeCuboid(path, measures);
    const cuboid = new Cuboid({
      dimensions: dimSet,
      dataSource: cuboidDataSource,
    });
    this.cuboids.set(key, cuboid);
    return cuboid;
  }
}
