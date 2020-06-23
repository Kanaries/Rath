import { Record } from "../../commonTypes";
import { IField, FieldDictonary, IFieldSummary, IInsightSpace, InsightWorker } from "./interfaces";
import { getFieldsSummary } from "./fieldSummary";
import { DataGraph } from "./dataGraph";
import { Cube } from "../../cube";
import { StatFuncName, getCombination, normalize, linearMapPositive, entropy } from "../../statistics";
import { CHANNEL } from "../../constant";
import { InsightWorkerCollection } from "./workerCollection";

interface VIProps {
    dataSource: Record[];
    fields?: string[];
    dimensions?: string[];
    measures?: string[];
}

const CUBE_KEY_SPLITER = "_join_";
export interface ViewSpace {
    dimensions: string[];
    measures: string[];
    contextDimensions: string[]
}

interface ConstRange {
    MAX: number;
    MIN: number;
}
export class VisualInsights {
    public dataSource: Record[];
    private _dimensions: string[];
    private _measures: string[];
    private _fields: IFieldSummary[];
    private fieldDictonary: FieldDictonary;
    public dataGraph: DataGraph;
    public cubePool: Map<string, Cube>;
    public workerCollection: InsightWorkerCollection;
    public subSpaces: ViewSpace[];
    /**
     * number of dimensions appears in a view.
     */
    public DIMENSION_NUM_IN_VIEW: ConstRange = {
        MAX: 3,
        MIN: 1
    };
    /**
     * number of measures appears in a view.
     */
    public MEASURE_NUM_IN_VIEW: ConstRange = {
        MAX: 3,
        MIN: 1
    };
    public constructor(props: VIProps) {
        this.dataSource = props.dataSource;
        let fieldKeys: string[] = [];
        if (props.fields) fieldKeys = props.fields;
        else if (props.dimensions && props.measures) fieldKeys = [...props.dimensions, ...props.measures];
        else fieldKeys = this.dataSource.length > 0 ? Object.keys(this.dataSource[0]) : [];

        const { fields, dictonary } = getFieldsSummary(fieldKeys, this.dataSource);
        if (props.dimensions && props.measures) {
            fields.forEach((f) => {
                if (props.dimensions.includes(f.key)) {
                    f.analyticType = "dimension";
                } else {
                    f.analyticType = "measure";
                }
            });
        }
        this.fields = fields;
        this.fieldDictonary = dictonary;
        this.cubePool = new Map();
        this.workerCollection = InsightWorkerCollection.init();
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
    public get measures() {
        return this._measures;
    }
    public buildGraph() {
        this.dataGraph = new DataGraph(this.dataSource, this.dimensions, this.measures);
    }
    public buildCube() {
        const { measures, dataSource, dataGraph } = this;
        const ops: StatFuncName[] = measures.map((m) => "sum");
        dataGraph.DClusters.forEach((group) => {
            const orderedGroup = [...group].sort();
            const key = orderedGroup.join(CUBE_KEY_SPLITER);
            const cube = new Cube({
                dimensions: group,
                measures,
                dataSource,
                ops,
            });
            cube.buildBaseCuboid();
            this.cubePool.set(key, cube);
        });
    }
    public clusterFields(): { DClusters: string[][]; MClusters: string[][] } {
        const DClusters = this.dataGraph.clusterDGraph(this.dataSource);
        const MClusters = this.dataGraph.clusterMGraph(this.dataSource);
        return { DClusters, MClusters };
    }
    public static getCombinationFromClusterGroups(
        groups: string[][],
        limitSize: ConstRange
    ): string[][] {
        let fieldSets: string[][] = [];
        for (let group of groups) {
            let combineFieldSet: string[][] = getCombination(group, limitSize.MIN, limitSize.MAX);
            fieldSets.push(...combineFieldSet);
        }
        return fieldSets;
    }
    public getSubspaces(
        DIMENSION_NUM_IN_VIEW: ConstRange = this.DIMENSION_NUM_IN_VIEW,
        MEASURE_NUM_IN_VIEW: ConstRange = this.MEASURE_NUM_IN_VIEW
    ): ViewSpace[] {
        // todo: design when to compute clusters.
        const dimensionGroups = this.dataGraph.DClusters;
        const measureGroups = this.dataGraph.MClusters;
        // const dimensionSets = VisualInsights.getCombinationFromClusterGroups(
        //     dimensionGroups,
        //     MAX_DIMENSION_NUM_IN_VIEW
        // );

        const measureSets = VisualInsights.getCombinationFromClusterGroups(measureGroups, MEASURE_NUM_IN_VIEW);

        // const subspaces = crossGroups(dimensionSets, measureSets);
        const subspaces: ViewSpace[] = [];
        for (let group of dimensionGroups) {
            const dimSets = getCombination(group, DIMENSION_NUM_IN_VIEW.MIN, DIMENSION_NUM_IN_VIEW.MAX);
            for (let dims of dimSets) {
                for (let meas of measureSets) {
                    subspaces.push({
                        dimensions: dims,
                        measures: meas,
                        contextDimensions: group
                    });
                }
            }
        }
        this.subSpaces = subspaces;
        return subspaces;
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
        let index = 0;
        for (let space of viewSpaces) {
            const { dimensions, measures, contextDimensions } = space;
            let key = [...contextDimensions].sort().join(CUBE_KEY_SPLITER);
            // console.log("worker key", key, this.cubePool.has(key));
            if (this.cubePool.has(key)) {
                let cube = this.cubePool.get(key);
                let cuboid = cube.getCuboid(dimensions);
                const aggData = cuboid.state;
                const imp = VisualInsights.getSpaceImpurity(aggData, dimensions, measures);
                const jobPool = [];

                this.workerCollection.each((iWorker, name) => {

                    // tslint:disable-next-line: no-shadowed-variable
                    const job = async (iWorker: InsightWorker, name: string) => {
                        try {
                            let iSpace = await iWorker(aggData, dimensions, measures, context.fieldDictonary, context);
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

            }
        }
        console.log('before return ansSpace', index, ansSpace.length, ansSpace)
        return ansSpace;
    }
    // todo:
    // static specification (fields: IFieldSummary[], dataSource: Record[]) {

    // }
}
