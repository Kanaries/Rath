import { toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { useGlobalStore } from '../../../store';
import DataViewLiteEditor from '../dataViewLiteEditor';

const PainterOperations: React.FC = (props) => {
    const { painterStore, dataSourceStore } = useGlobalStore();
    const { painterView } = painterStore;
    return (
        <div style={{ margin: '1em 0em'}}>
            {painterView.dataView && (
                <DataViewLiteEditor
                    view={toJS(painterView.dataView)}
                    globalFields={dataSourceStore.fieldMetas}
                    onAddViewField={(fid) => {
                        painterStore.addMainViewField(fid);
                    }}
                    onRemoveViewField={(fid) => {
                        painterStore.removeMainViewField(fid);
                    }}
                    onAddFilter={(filter) => {
                        painterStore.addMainViewFilter(filter);
                    }}
                    onRemoveFilter={(fid) => {
                        painterStore.removeMainViewFilter(fid);
                    }}
                />
            )}
        </div>
    );
};

export default observer(PainterOperations);
