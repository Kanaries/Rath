import { DataSet, Filters, IDataSet, IDataSetInfo, IDataSource, IMutField, Record } from '../interfaces';
import { makeAutoObservable, observable } from 'mobx';
import { transData } from '../dataSource/utils';
import { GEMO_TYPES } from '../config';

interface VisualConfig {
    defaultAggregated: boolean;
    geoms: string[];
    defaultStack: boolean;
}

export class CommonStore {
    public datasets: IDataSet[] = [];
    public dataSources: IDataSource[] = [];
    public dsIndex: number = 0;
    public tmpDSName: string = '';
    public tmpDSRawFields: IMutField[] = [];
    public tmpDataSource: Record[] = [];
    public showDSPanel: boolean = false;
    public showInsightBoard: boolean = false;
    public vizEmbededMenu: { show: boolean; position: [number, number] } = { show: false, position: [0, 0] };

    public filters: Filters = {};
    constructor () {
        this.datasets = [];
        this.dataSources = [];
        makeAutoObservable(this, {
            dataSources: observable.ref,
            tmpDataSource: observable.ref,
            filters: observable.ref
        });
    }
    public get currentDataset (): DataSet {
        const datasetIndex = this.dsIndex;
        if (this.datasets.length > 0) {
            const dataSourceId = this.datasets[datasetIndex].dsId;
            const dataSource = this.dataSources.find(d => d.id === dataSourceId);
            return {
                ...this.datasets[datasetIndex],
                dataSource: dataSource ? dataSource.data : []
            }
        }
        return {
            id: '__null_ds__',
            name: 'Empty Dataset',
            rawFields: [],
            dataSource: []
        }
    }
    public setShowDSPanel (show: boolean) {
        this.showDSPanel = show;
    }
    public setShowInsightBoard (show: boolean) {
        this.showInsightBoard = show;
    }
    public showEmbededMenu (position: [number, number]) {
        this.vizEmbededMenu.show = true;
        this.vizEmbededMenu.position = position;
    }
    public closeEmbededMenu () {
        this.vizEmbededMenu.show = false;
    }
    public initTempDS () {
        this.tmpDSName = 'New Dataset'
        this.tmpDSRawFields = [];
        this.tmpDataSource = [];
    }
    public updateTempFields (fields: IMutField[]) {
        this.tmpDSRawFields = fields;
    }

    public updateTempFieldAnalyticType (fieldKey: string, analyticType: IMutField['analyticType']) {
        const field = this.tmpDSRawFields.find(f => f.key === fieldKey);
        if (field) {
            field.analyticType = analyticType;
        }
    }

    public updateTempName (name: string) {
        this.tmpDSName = name;
    }

    public updateTempDS (rawData: Record[]) {
        const result = transData(rawData);
        // TODO: need fix web-data-loader issue #2
        this.tmpDataSource = result.dataSource.slice(0, -1);
        this.tmpDSRawFields = result.fields;
    }

    public commitTempDS () {
        const { tmpDSName, tmpDSRawFields, tmpDataSource } = this;
        this.addAndUseDS({
            dataSource: tmpDataSource,
            rawFields: tmpDSRawFields,
            name: tmpDSName
        })
        this.setShowDSPanel(false);
        this.initTempDS();
    }

    public startDSBuildingTask () {
        this.initTempDS();
        this.showDSPanel = true;
    }
    public addAndUseDS(dataset: IDataSetInfo) {
        const datasetId = this.addDS(dataset);
        this.dsIndex = this.datasets.length - 1;
        return datasetId
    }
    public addDS(dataset: IDataSetInfo) {
        const timestamp = new Date().getTime();
        const dataSetId = `dst-${timestamp}`
        const dataSourceId = `dse-${timestamp}`;
        this.dataSources.push({
            id: dataSourceId,
            data: dataset.dataSource
        })
        this.datasets.push({
            id: dataSetId,
            name: dataset.name,
            rawFields: dataset.rawFields,
            dsId: dataSourceId
        })
        return dataSetId;
    }
    public removeDS(datasetId: string) {
        const datasetIndex = this.datasets.findIndex(d => d.id === datasetId);
        if (datasetIndex > -1) {
            const dataSourceId = this.datasets[datasetIndex].dsId;
            const dataSourceIndex = this.dataSources.findIndex(d => d.id === dataSourceId);
            this.dataSources.splice(dataSourceIndex, 1);
            this.datasets.splice(datasetIndex, 1);
        }
    }
    public useDS(datasetId: string) {
        const datasetIndex = this.datasets.findIndex(d => d.id === datasetId);
        if (datasetIndex > -1) {
            this.dsIndex = datasetIndex;
        }
    }
    public createPlaceholderDS() {
        this.addDS({
            name: '新数据源',
            dataSource: [],
            rawFields: []
        })
    }
    public setFilters (props: Filters) {
        this.filters = props;
    }
    public destroy () {
        this.dataSources = [];
        this.datasets = [];
    }
}