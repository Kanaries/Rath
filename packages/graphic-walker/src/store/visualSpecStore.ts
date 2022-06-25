import { IReactionDisposer, makeAutoObservable, reaction, toJS } from "mobx";
import { IViewField } from "../interfaces";
import { CommonStore } from "./commonStore";
import { v4 as uuidv4 } from 'uuid';
import { Specification } from "visual-insights";
import { GEMO_TYPES } from "../config";
import { makeBinField } from "../utils/normalization";
import { COUNT_FIELD_ID } from "../constants";

interface VisualConfig {
    defaultAggregated: boolean;
    geoms:  string[];        
    defaultStack: boolean;
    showActions: boolean;
    interactiveScale: boolean;
    sorted: 'none' | 'ascending' | 'descending';
    size: {
        mode: 'auto' | 'fixed';
        width: number;
        height: number;
    }
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

const CHANNEL_LIMIT = {
    rows: Infinity,
    columns: Infinity,
    color: 1,
    opacity: 1,
    size: 1,
}

function getChannelSizeLimit (channel: string): number {
    if (typeof CHANNEL_LIMIT[channel] === 'undefined') return 0;
    return CHANNEL_LIMIT[channel];
}



function geomAdapter (geom: string) {
    switch (geom) {
        case 'interval':
            return 'bar';
        case 'line':
            return 'line';
        case 'boxplot':
            return 'boxplot';
        case 'area':
            return 'area';
        case 'point':
            return 'point';
        case 'heatmap':
            return 'circle'
        case 'rect':
            return 'rect'
        case 'tick':
        default:
            return 'tick'
    }
}

export class VizSpecStore {
    // public fields: IViewField[] = [];
    private commonStore: CommonStore;
    public draggableFieldState: DraggableFieldState;
    private reactions: IReactionDisposer[] = []
    public visualConfig: VisualConfig ={
        defaultAggregated: true,
        geoms: [GEMO_TYPES[0].value],
        defaultStack: true,
        showActions: false,
        interactiveScale: false,
        sorted: 'none',
        size: {
            mode: 'auto',
            width: 320,
            height: 200
        }
    }
    constructor (commonStore: CommonStore) {
        this.commonStore = commonStore;
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
        // FIXME!!!!!
        this.reactions.push(reaction(() => commonStore.currentDataset, (dataset) => {
            this.initState();
            this.draggableFieldState.fields = dataset.rawFields.map((f) => ({
                dragId: uuidv4(),
                fid: f.fid,
                name: f.name || f.fid,
                aggName: f.analyticType === 'measure' ? 'sum' : undefined,
                analyticType: f.analyticType,
                semanticType: f.semanticType
            }))
            this.draggableFieldState.dimensions = dataset.rawFields
                .filter(f => f.analyticType === 'dimension')
                .map((f) => ({
                    dragId: uuidv4(),
                    fid: f.fid,
                    name: f.name || f.fid,
                    semanticType: f.semanticType,
                    analyticType: f.analyticType,
            }))
            this.draggableFieldState.measures = dataset.rawFields
                .filter(f => f.analyticType === 'measure')
                .map((f) => ({
                    dragId: uuidv4(),
                    fid: f.fid,
                    name: f.name || f.fid,
                    analyticType: f.analyticType,
                    semanticType: f.semanticType,
                    aggName: 'sum'
            }))
            // this.draggableFieldState.measures.push({
            //     dragId: uuidv4(),
            //     fid: COUNT_FIELD_ID,
            //     name: '记录数',
            //     analyticType: 'measure',
            //     semanticType: 'quantitative',
            //     aggName: 'count'
            // })
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
                fields.push(...state[dkey].filter(f => f.analyticType === 'dimension'))
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
            .filter(dkey => !MetaFieldKeys.includes(dkey))
            .forEach(dkey => {
                fields.push(...state[dkey].filter(f => f.analyticType === 'measure'))
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
        // this.visualConfig[configKey] = //value;
        if (configKey === 'defaultAggregated' || configKey === 'defaultStack' || configKey === 'showActions' || configKey === 'interactiveScale') {
            this.visualConfig[configKey] = Boolean(value);
        } else if (configKey === 'geoms' && value instanceof Array) {
            this.visualConfig[configKey] = value;
        } else if (configKey === 'size' && value instanceof Object) {
            this.visualConfig[configKey] = value;
        } else if (configKey === 'sorted') {
            this.visualConfig[configKey] = value;
        } else {
            console.error('unknow key' + configKey)
        }
    }
    public setChartLayout(props: {mode: VisualConfig['size']['mode'], width?: number, height?: number }) {
        const {
            mode = this.visualConfig.size.mode,
            width = this.visualConfig.size.width,
            height = this.visualConfig.size.height
        } = props
        this.visualConfig.size.mode = mode;
        this.visualConfig.size.width = width;
        this.visualConfig.size.height = height;
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
        // 来源是不是metafield，是->clone；不是->直接删掉
        if (MetaFieldKeys.includes(sourceKey)) {
            // use toJS for cloning
            movingField = toJS(this.draggableFieldState[sourceKey][sourceIndex])
            movingField.dragId = uuidv4();
        } else {
            [movingField] = this.draggableFieldState[sourceKey].splice(sourceIndex, 1);
        }
        // 目的地是metafields的情况，只有在来源也是metafields时，会执行字段类型转化操作
        if (MetaFieldKeys.includes(destinationKey)) {
            if (!MetaFieldKeys.includes(sourceKey))return;
            this.draggableFieldState[sourceKey].splice(sourceIndex, 1);
            movingField.analyticType = destinationKey === 'dimensions' ? 'dimension' : 'measure';
        }
        const limitSize = getChannelSizeLimit(destinationKey);
        const fixedDestinationIndex = Math.min(destinationIndex, limitSize - 1);
        const overflowSize = Math.max(0, this.draggableFieldState[destinationKey].length + 1 - limitSize);
        this.draggableFieldState[destinationKey].splice(fixedDestinationIndex, overflowSize, movingField)
    }
    public removeField(sourceKey: keyof DraggableFieldState, sourceIndex: number) {
        if (MetaFieldKeys.includes(sourceKey))return;
        this.draggableFieldState[sourceKey].splice(sourceIndex, 1);
    }
    public createBinField(stateKey: keyof DraggableFieldState, index: number) {
        const originField = this.draggableFieldState[stateKey][index]
        const binField: IViewField = {
            fid: uuidv4(),
            dragId: uuidv4(),
            name: `bin(${originField.name})`,
            semanticType: 'ordinal',
            analyticType: 'dimension',
        };
        this.draggableFieldState.dimensions.push(binField);
        this.commonStore.currentDataset.dataSource = makeBinField(this.commonStore.currentDataset.dataSource, originField.fid, binField.fid)
    }
    public setFieldAggregator (stateKey: keyof DraggableFieldState, index: number, aggName: string) {
        const fields = this.draggableFieldState[stateKey]
        if (fields[index]) {
            fields[index].aggName = aggName;
        }
    }
    public get sortCondition () {
        const { rows, columns } = this.draggableFieldState;
        const yField = rows.length > 0 ? rows[rows.length - 1] : null;
        const xField = columns.length > 0 ? columns[columns.length - 1] : null;
        if (xField !== null && xField.analyticType === 'dimension' && yField !== null && yField.analyticType === 'measure') {
            return true
        }
        if (xField !== null && xField.analyticType === 'measure' && yField !== null && yField.analyticType === 'dimension') {
            return true
        }
        return false;
    }
    public setFieldSort (stateKey: keyof DraggableFieldState, index: number, sortType: 'none' | 'ascending' | 'descending') {
        this.draggableFieldState[stateKey][index].sort = sortType;
    }
    public applyDefaultSort(sortType: 'none' | 'ascending' | 'descending' = 'ascending') {
        const { rows, columns } = this.draggableFieldState;
        const yField = rows.length > 0 ? rows[rows.length - 1] : null;
        const xField = columns.length > 0 ? columns[columns.length - 1] : null;

        if (xField !== null && xField.analyticType === 'dimension' && yField !== null && yField.analyticType === 'measure') {
            xField.sort = sortType
            return
        }
        if (xField !== null && xField.analyticType === 'measure' && yField !== null && yField.analyticType === 'dimension') {
            yField.sort = sortType
            return
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
                this.appendField('rows', fields.find(f => f.fid === facet));
            }
        }
        if (spec.position && spec.position.length > 1) {
            this.appendField('rows', fields.find(f => f.fid === spec.position![1]));
            this.appendField('columns', fields.find(f => f.fid === spec.position![0]));
        }
        if (spec.color && spec.color.length > 0) {
            this.appendField('color', fields.find(f => f.fid === spec.color![0]));
        }
        if (spec.size && spec.size.length > 0) {
            this.appendField('size', fields.find(f => f.fid === spec.size![0]));
        }
        if (spec.opacity && spec.opacity.length > 0) {
            this.appendField('opacity', fields.find(f => f.fid === spec.opacity![0]));
        }

    }
    public destroy () {
        this.reactions.forEach(rec => {
            rec();
        })
    }
}