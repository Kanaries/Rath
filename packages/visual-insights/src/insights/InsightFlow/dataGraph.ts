import { Record } from "../../commonTypes";
import { crammersV, pearsonCC, CorrelationCoefficient } from "../../statistics";
import { getDimClusterGroups, getMeaSetsBasedOnClusterGroups } from "../subspaces";
import { CrammersVThreshold, PearsonCorrelation } from "../config";

export class DataGraph {
    public dimensions: string[];
    public measures: string[];
    /**
     * dimension graph(adjmatrix)
     */
    public DG: number[][];
    /**
     * measure graph(adjmatrix)
     */
    public MG: number[][];
    public DClusters: string[][];
    public MClusters: string[][];
    public DIMENSION_CORRELATION_THRESHOLD: number = CrammersVThreshold;
    public MEASURE_CORRELATION_THRESHOLD: number = PearsonCorrelation.strong;
    public constructor(dataSource: Record[], dimensions: string[], measures: string[]) {
        this.dimensions = dimensions;
        this.measures = measures;
        this.computeDGraph(dataSource);
        this.computeMGraph(dataSource);
    }
    private computeGraph(dataSource: Record[], fields: string[], cc: CorrelationCoefficient): number[][] {
        let matrix: number[][] = fields.map((f) => fields.map(() => 0));
        for (let i = 0; i < fields.length; i++) {
            matrix[i][i] = 1;
            for (let j = i + 1; j < fields.length; j++) {
                matrix[i][j] = matrix[j][i] = cc(dataSource, fields[i], fields[j]);
            }
        }
        return matrix;
    }
    public computeDGraph(dataSource: Record[], cc: CorrelationCoefficient = crammersV): number[][] {
        this.DG = this.computeGraph(dataSource, this.dimensions, cc);
        return this.DG;
    }
    public computeMGraph(dataSource: Record[], cc: CorrelationCoefficient = pearsonCC): number[][] {
        this.MG = this.computeGraph(dataSource, this.measures, cc);
        return this.MG;
    }
    public clusterDGraph(dataSource: Record[], CORRELATION_THRESHOLD?: number) {
        const { dimensions, DIMENSION_CORRELATION_THRESHOLD } = this;
        this.DClusters = getDimClusterGroups(
            dataSource,
            dimensions,
            CORRELATION_THRESHOLD || DIMENSION_CORRELATION_THRESHOLD
        );
        return this.DClusters;
    }
    public clusterMGraph(dataSource: Record[], CORRELATION_THRESHOLD?: number) {
        const { measures, MEASURE_CORRELATION_THRESHOLD } = this;
        this.MClusters = getMeaSetsBasedOnClusterGroups(
            dataSource,
            measures,
            CORRELATION_THRESHOLD || MEASURE_CORRELATION_THRESHOLD
        );
        return this.MClusters;
    }
}
