import { IReactionDisposer, makeAutoObservable, reaction, toJS } from "mobx";
import { IViewField } from "../interfaces";
import { CommonStore } from "./commonStore";
import { v4 as uuidv4 } from 'uuid';

export interface DraggableFieldState {
    fields: IViewField[];
    rows: IViewField[];
    columns: IViewField[];
    color: IViewField[];
    opacity: IViewField[];
    size: IViewField[];
  }

export class VizSpecStore {
    // public fields: IViewField[] = [];
    public draggableFieldState: DraggableFieldState;
    private reactions: IReactionDisposer[] = []
    constructor (commonStore: CommonStore) {
        this.draggableFieldState = {
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
        }))
    }
    public get viewDimensions (): IViewField[] {
        const { draggableFieldState } = this;
        const state = toJS(draggableFieldState);
        const fields: IViewField[] = [];
        (Object.keys(state) as (keyof DraggableFieldState)[])
            .filter(dkey => dkey !== 'fields')
            .forEach(dkey => {
                fields.push(...draggableFieldState[dkey].filter(f => f.type === 'D'))
            })
        return fields;
    }
    public get viewMeasures (): IViewField[] {
        const { draggableFieldState } = this;
        const state = toJS(draggableFieldState);
        const fields: IViewField[] = [];
        (Object.keys(state) as (keyof DraggableFieldState)[])
            .filter(dkey => dkey !== 'fields')
            .forEach(dkey => {
                fields.push(...draggableFieldState[dkey].filter(f => f.type === 'M'))
            })
        return fields;
    }
    public initState () {
        this.draggableFieldState = {
            fields: [],
            rows: [],
            columns: [],
            color: [],
            opacity: [],
            size: []
        }
    }
    public reorderField(stateKey: keyof DraggableFieldState, sourceIndex: number, destinationIndex: number) {
        if (stateKey === 'fields') return;
        if (sourceIndex === destinationIndex) return;
        const fields = this.draggableFieldState[stateKey];
        const [field] = fields.splice(sourceIndex, 1);
        fields.splice(destinationIndex, 0, field);
    }
    public moveField(sourceKey: keyof DraggableFieldState, sourceIndex: number, destinationKey: keyof DraggableFieldState, destinationIndex: number) {
        let movingField: IViewField;
        if (sourceKey === 'fields') {
            console.log('sourcekey', sourceKey)
            // use toJS for cloning
            movingField = toJS(this.draggableFieldState[sourceKey][sourceIndex])
            movingField.dragId = uuidv4();
        } else {
            [movingField] = this.draggableFieldState[sourceKey].splice(sourceIndex, 1);
        }
        if (destinationKey === 'fields')return;
        this.draggableFieldState[destinationKey].splice(destinationIndex, 0, movingField)
    }
    public removeField(sourceKey: keyof DraggableFieldState, sourceIndex: number) {
        if (sourceKey === 'fields')return;
        this.draggableFieldState[sourceKey].splice(sourceIndex, 1);
    }
    public setFieldAggregator (stateKey: keyof DraggableFieldState, index: number, aggName: string) {
        const fields = this.draggableFieldState[stateKey]
        if (fields[index]) {
            fields[index].aggName = aggName;
        }
    }
    public destroy () {
        this.reactions.forEach(rec => {
            rec();
        })
    }
}