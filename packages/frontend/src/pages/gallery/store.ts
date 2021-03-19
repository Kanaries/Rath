import { action, computed, makeAutoObservable, makeObservable, observable, reaction } from 'mobx'
import { clusterMeasures, FieldSummary, Subspace, ViewSpace } from '../../service';
import { Aggregator, Field, globalRef, Record } from '../../global';
import { recallLogger } from '../../loggers/recall';
import { Specification } from '../../visBuilder/vegaBase';
import { specification } from 'visual-insights';

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
    public viewSpaces: ViewSpace[] = [];
    public visualConfig: PreferencePanelConfig;
    public loading: boolean = false;
    public dataSource: Record[] = [];
    public fields: FieldSummary[] = [];
    public subspaceList: Subspace[] = [];

    constructor() {
        this.visualConfig = {
            aggregator: "sum",
            defaultAggregated: true,
            defaultStack: true,
        };
        makeAutoObservable(this, {
            dataSource: observable.shallow,
            fields: observable.shallow,
            subspaceList: observable.shallow,
            viewSpaces: observable.shallow
        });
    }
    public get currentViewSpace() {
        return this.viewSpaces[this.currentPage];
    }

    public get currentSpace () {
        return this.subspaceList.find((subspace) => {
            return subspace.dimensions.join(",") === this.vizRecommand.dimensions.join(",");
        })!;
    }

    public setVisualConfig(config: PreferencePanelConfig) {
        this.visualConfig = config;
    }

    public init(dataSource: Record[], fields: FieldSummary[], subspaceList: Subspace[]) {
        this.likes = new Set();
        this.currentPage = 0;
        this.viewSpaces = [];
        this.dataSource = dataSource;
        this.fields = fields;
        this.subspaceList = subspaceList;
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
    public setViewSpaces(viewSpaces: ViewSpace[]) {
        this.viewSpaces = viewSpaces;
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
        if (schema.geomType && (schema.geomType.includes('point') || schema.geomType.includes('density'))) {
            this.visualConfig.defaultAggregated = false;
        } else {
            this.visualConfig.defaultAggregated = true
        }
    }
    public get vizRecommand(): DataView {
        const { currentViewSpace, fields, dataSource } = this;
        if (currentViewSpace) {
            const { dimensions, measures } = currentViewSpace;
            const fieldsInView = fields.filter((f) => dimensions.includes(f.fieldName) || measures.includes(f.fieldName));
            try {
                const { schema } = specification(
                    fieldsInView.map((f) => [f.fieldName, f.entropy!, f.maxEntropy!, {name: f.fieldName, type: f.type}]),
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
                console.error(error)
            }
        }
        return DEFAULT_DATA_VIEW
    }
    public async clusterMeasures (maxGroupNumber: number, useServer: boolean) {
        const { subspaceList } = this;
        this.loading = true;
        const viewSpaces = await clusterMeasures(maxGroupNumber, subspaceList.map(space => {
            return {
            dimensions: space.dimensions,
            measures: space.measures,
            matrix: space.correlationMatrix
            };
        }), useServer);
        this.viewSpaces = viewSpaces;
        this.loading = false;
        this.clearLikes();
    }
}

const storeRef = {
    store: new GalleryStore()
}

export function useGalleryStore () {
    // const store = useMemo<GalleryStore>(() => {
    //     return new GalleryStore();
    // }, [])
    // return store;
    return storeRef.store
}

export function getGalleryStore () {
    return storeRef.store;
}