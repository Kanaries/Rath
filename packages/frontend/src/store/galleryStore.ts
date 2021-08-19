import { makeAutoObservable, runInAction } from "mobx";
import { FieldSummary } from "../service";
import { Aggregator, globalRef, Record } from "../global";
import { recallLogger } from "../loggers/recall";
import { Specification } from "../visBuilder/vegaBase";
import { specification } from "visual-insights";
import { fieldMeta2fieldSummary } from "../utils/transform";
import { LitePipeStore } from "./pipeLineStore/lite";

interface DataView {
    schema: Specification;
    aggData: Record[];
    fieldFeatures: FieldSummary[];
    dimensions: string[];
    measures: string[];
}

export interface PreferencePanelConfig {
    aggregator: Aggregator;
    defaultAggregated: boolean;
    defaultStack: boolean;
}

const DEFAULT_DATA_VIEW: DataView = {
    schema: {
        position: [],
        color: [],
        opacity: [],
        geomType: [],
    },
    fieldFeatures: [],
    aggData: [],
    dimensions: [],
    measures: [],
};

export class GalleryStore {
    public likes: Set<number> = new Set();
    public currentPage: number = 0;
    public showAssociation: boolean = false;
    public showConfigPanel: boolean = false;
    public visualConfig: PreferencePanelConfig;
    public loading: boolean = false;
    private pipeLine: LitePipeStore;

    constructor(pipeStore: LitePipeStore) {
        this.visualConfig = {
            aggregator: "sum",
            defaultAggregated: true,
            defaultStack: true,
        };
        makeAutoObservable(this);
        this.pipeLine = pipeStore;

    }
    public get currentViewSpace() {
        return this.viewSpaces[this.currentPage];
    }

    public get progressTag () {
        return this.pipeLine.progressTag;
    }

    public get dataSource () {
        return this.pipeLine.cookedDataset.transedData;
    }

    public get subspaceList () {
        return this.pipeLine.dataSubspaces;
    }

    public get fields () {
        const metas = this.pipeLine.cookedDataset.transedMetas;
        return fieldMeta2fieldSummary(metas);
        // return this.dataSourceStore.cookedDatasetRef.current.transedMetas.map(f )
    }

    public get viewSpaces () {
        console.log(this.pipeLine.viewSpaces)
        return this.pipeLine.viewSpaces;
    }

    public setVisualConfig(config: PreferencePanelConfig) {
        this.visualConfig = config;
    }

    public init() {
        this.likes = new Set();
        this.currentPage = 0;
    }
    public clearLikes() {
        this.likes = new Set();
    }
    public async likeIt(index: number, spec: any) {
        this.likes.add(index);
        recallLogger({
            index,
            total: this.viewSpaces.length,
            spec,
            vegaSpec: globalRef.baseVisSpec,
        });
    }

    public goToPage(pageNo: number) {
        this.currentPage = pageNo;
    }
    public nextPage() {
        this.currentPage = (this.currentPage + 1) % this.viewSpaces.length;
    }
    public lastPage() {
        this.currentPage = (this.currentPage - 1 + this.viewSpaces.length) % this.viewSpaces.length;
    }
    // ugly code
    // todo:
    // implement this in specification
    // + check geomType
    // + check geom number and aggregated geom number
    public scatterAdjust(schema: Specification) {
        if (schema.geomType && (schema.geomType.includes("point") || schema.geomType.includes("density"))) {
            this.visualConfig.defaultAggregated = false;
        } else {
            this.visualConfig.defaultAggregated = true;
        }
    }
    public get vizRecommand(): DataView {
        const { currentViewSpace, fields, dataSource } = this;
        if (currentViewSpace) {
            const { dimensions, measures } = currentViewSpace;
            const fieldsInView = fields.filter((f) => dimensions.includes(f.fieldName) || measures.includes(f.fieldName));
            try {
                const { schema } = specification(
                    fieldsInView.map((f) => [f.fieldName, f.entropy!, f.maxEntropy!, { name: f.fieldName, type: f.type }]),
                    dataSource,
                    dimensions,
                    measures
                );

                // this.scatterAdjust(schema);
                return {
                    schema,
                    fieldFeatures: fieldsInView,
                    aggData: dataSource,
                    dimensions,
                    measures,
                };
            } catch (error) {
                console.error(error);
            }
        }
        return DEFAULT_DATA_VIEW;
    }

    public changeVisualConfig (updater: (config: PreferencePanelConfig) => void) {
        runInAction(() => {
            updater(this.visualConfig);
        })
    }
}
