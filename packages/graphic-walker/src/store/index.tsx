import React, { useContext } from 'react';
import { DataSet, IDataSet, IDataSetInfo, IDataSource, IMutField, Record } from '../interfaces';

import { makeAutoObservable, observable } from 'mobx';
import { useEffect } from 'react';
import { transData } from '../dataSource/utils';
class GlobalStore {
    public datasets: IDataSet[] = [];
    public dataSources: IDataSource[] = [];
    public dsIndex: number = 0;
    public tmpDSName: string = '';
    public tmpDSRawFields: IMutField[] = [];
    public tmpDataSource: Record[] = [];
    public showDSPanel: boolean = false;
    constructor () {
        this.datasets = [];
        this.dataSources = [];
        makeAutoObservable(this, {
            dataSources: observable.ref,
            tmpDataSource: observable.ref
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
    public destroy () {
        this.dataSources = [];
        this.datasets = [];
    }
}

const initStore = new GlobalStore();
const StoreContext = React.createContext<GlobalStore>(initStore);

export const StoreWrapper: React.FC = props => {
    useEffect(() => {
        return () => {
            initStore.destroy();
        }
    }, [])
    return <StoreContext.Provider value={initStore}>
        { props.children }
    </StoreContext.Provider>
}

export function useGlobalStore() {
    return useContext(StoreContext);
}
