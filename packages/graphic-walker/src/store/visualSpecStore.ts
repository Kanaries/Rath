import { IReactionDisposer, makeAutoObservable, reaction, toJS } from "mobx";
import { IViewField } from "../interfaces";
import { CommonStore } from "./commonStore";
import { v4 as uuidv4 } from 'uuid';
import { Specification } from "visual-insights";
import { GEMO_TYPES } from "../config";

interface VisualConfig {
    defaultAggregated: boolean;
    geoms: string[];
    defaultStack: boolean;
}

export interface DraggableFieldState {
    fields: IViewField[];
    dimensions: IViewField[];
    measures: IViewField[];
    rows: IViewField[];
    columns: IViewField[];
    color: IViewField[];
    opacity: IViewField[];
    size: IViewField[];
}

export const MetaFieldKeys: Array<keyof DraggableFieldState> = [
    'dimensions',
    'measures',
    'fields'
]

function geomAdapter (geom: string) {
    switch (geom) {
        case 'interval':
            return 'bar';
        case 'line':
            return 'line';
        case 'point':
            return 'point';
        case 'heatmap':
            return 'circle'
        case 'tick':
        default:
            return 'tick'
    }
}

export class VizSpecStore {
    // public fields: IViewField[] = [];
    public draggableFieldState: DraggableFieldState;
    private reactions: IReactionDisposer[] = []
    public visualConfig: VisualConfig ={
        defaultAggregated: true,
        geoms: [GEMO_TYPES[0].value],
        defaultStack: true
    }
    constructor (commonStore: CommonStore) {
        this.draggableFieldState = {
            dimensions: [],
            measures: [],
            fields: [],
            rows: [],
            columns: [],
            color: [],
            opacity: [],
            size: []
        }
        makeAutoObservable(this);
        this.reactions.push(reaction(() => commonStore.currentDataset, (dataset) => {
            this.initState();
            this.draggableFieldState.fields = dataset.rawFields.map((f) => ({
                dragId: uuidv4(),
                id: f.key,
                name: f.key,
                type: f.analyticType === 'dimension' ? 'D' : 'M',
                aggName: f.analyticType === 'measure' ? 'sum' : undefined,
            }))
            this.draggableFieldState.dimensions = dataset.rawFields
                .filter(f => f.analyticType === 'dimension')
                .map((f) => ({
                    dragId: uuidv4(),
                    id: f.key,
                    name: f.key,
                    type: 'D'
            }))
            this.draggableFieldState.measures = dataset.rawFields
                .filter(f => f.analyticType === 'measure')
                .map((f) => ({
                    dragId: uuidv4(),
                    id: f.key,
                    name: f.key,
                    type: 'M',
                    aggName: 'sum'
            }))
        }))
    }
    /**
     * dimension fields in visualization
     */
    public get viewDimensions (): IViewField[] {
        const { draggableFieldState } = this;
        const state = toJS(draggableFieldState);
        const fields: IViewField[] = [];
        (Object.keys(state) as (keyof DraggableFieldState)[])
            .filter(dkey => !MetaFieldKeys.includes(dkey))
            .forEach(dkey => {
                fields.push(...draggableFieldState[dkey].filter(f => f.type === 'D'))
            })
        return fields;
    }
    /**
     * dimension fields in visualization
     */
    public get viewMeasures (): IViewField[] {
        const { draggableFieldState } = this;
        const state = toJS(draggableFieldState);
        const fields: IViewField[] = [];
        (Object.keys(state) as (keyof DraggableFieldState)[])
            .filter(dkey => MetaFieldKeys.includes(dkey))
            .forEach(dkey => {
                fields.push(...draggableFieldState[dkey].filter(f => f.type === 'M'))
            })
        return fields;
    }
    public initState () {
        this.draggableFieldState = {
            dimensions: [],
            measures: [],
            fields: [],
            rows: [],
            columns: [],
            color: [],
            opacity: [],
            size: []
        }
    }
    public clearState () {
        for (let key in this.draggableFieldState) {
            if (!MetaFieldKeys.includes(key as keyof DraggableFieldState)) {
                this.draggableFieldState[key] = []
            }
        }
    }
    public setVisualConfig (configKey: keyof VisualConfig, value: any) {
        this.visualConfig[configKey] = value;
    }
    public reorderField(stateKey: keyof DraggableFieldState, sourceIndex: number, destinationIndex: number) {
        if (MetaFieldKeys.includes(stateKey)) return;
        if (sourceIndex === destinationIndex) return;
        const fields = this.draggableFieldState[stateKey];
        const [field] = fields.splice(sourceIndex, 1);
        fields.splice(destinationIndex, 0, field);
    }
    public moveField(sourceKey: keyof DraggableFieldState, sourceIndex: number, destinationKey: keyof DraggableFieldState, destinationIndex: number) {
        let movingField: IViewField;
        if (MetaFieldKeys.includes(sourceKey)) {
            // use toJS for cloning
            movingField = toJS(this.draggableFieldState[sourceKey][sourceIndex])
            movingField.dragId = uuidv4();
        } else {
            [movingField] = this.draggableFieldState[sourceKey].splice(sourceIndex, 1);
        }
        if (MetaFieldKeys.includes(destinationKey))return;
        this.draggableFieldState[destinationKey].splice(destinationIndex, 0, movingField)
    }
    public removeField(sourceKey: keyof DraggableFieldState, sourceIndex: number) {
        if (MetaFieldKeys.includes(sourceKey))return;
        this.draggableFieldState[sourceKey].splice(sourceIndex, 1);
    }
    public setFieldAggregator (stateKey: keyof DraggableFieldState, index: number, aggName: string) {
        const fields = this.draggableFieldState[stateKey]
        if (fields[index]) {
            fields[index].aggName = aggName;
        }
    }
    public appendField (destinationKey: keyof DraggableFieldState, field: IViewField | undefined) {
        if (MetaFieldKeys.includes(destinationKey)) return;
        if (typeof field === 'undefined') return;
        const cloneField = toJS(field);
        cloneField.dragId = uuidv4();
        this.draggableFieldState[destinationKey].push(cloneField);
    }
    public renderSpec (spec: Specification) {
        const fields = this.draggableFieldState.fields;
        // thi
        // const [xField, yField, ] = spec.position;
        this.clearState();
        if (spec.geomType && spec.geomType.length > 0) {
            this.setVisualConfig('geoms', spec.geomType.map(g => geomAdapter(g)));
        }
        if (spec.facets && spec.facets.length > 0) {
            const facets = (spec.facets || []).concat(spec.highFacets || []);
            for (let facet of facets) {
                this.appendField('rows', fields.find(f => f.id === facet));
            }
        }
        if (spec.position && spec.position.length > 1) {
            this.appendField('rows', fields.find(f => f.id === spec.position![1]));
            this.appendField('columns', fields.find(f => f.id === spec.position![0]));
        }
        if (spec.color && spec.color.length > 0) {
            this.appendField('color', fields.find(f => f.id === spec.color![0]));
        }
        if (spec.size && spec.size.length > 0) {
            this.appendField('size', fields.find(f => f.id === spec.size![0]));
        }
        if (spec.opacity && spec.opacity.length > 0) {
            this.appendField('opacity', fields.find(f => f.id === spec.opacity![0]));
        }

    }
    public destroy () {
        this.reactions.forEach(rec => {
            rec();
        })
    }
}