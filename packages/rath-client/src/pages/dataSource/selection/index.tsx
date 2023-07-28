import React, { useState } from 'react';
import { Modal, ChoiceGroup, IconButton, ProgressIndicator } from '@fluentui/react';
import intl from 'react-intl-universal';
import { IDataSourceType } from '../../../global';
import { IMuteFieldBase, IRow } from '../../../interfaces';
import { useDataSourceTypeOptions } from '../config';
import DataLoadingStatus from '../dataLoadingStatus';
import type { DataSourceTag, IDBMeta } from '../../../utils/storage';
import DatabaseConnector from '../../dataConnection/database/main';
import FileData from './file';
import DemoData from './demo';
// import RestfulData from './restful';
import JSONAPI from './jsonAPI';
import OLAPData from './olap';
import HistoryPanel from './history';
import AirTableSource from './airtable';

interface SelectionProps {
    show: boolean;
    loading: boolean;
    onClose: () => void;
    onStartLoading: () => void;
    onLoadingFailed: (err: any) => void;
    onDataLoaded: (fields: IMuteFieldBase[], dataSource: IRow[], name?: string, tag?: DataSourceTag | undefined, withHistory?: IDBMeta | undefined) => void;
    onDataLoading: (p: number) => void;
    setLoadingAnimation: (on: boolean) => void;
}

const Selection: React.FC<SelectionProps> = props => {
    const { show, onClose, onDataLoaded, loading, onStartLoading, onLoadingFailed, onDataLoading, setLoadingAnimation } = props;

    const [dataSourceType, setDataSourceType] = useState<IDataSourceType>(IDataSourceType.LOCAL);
    const dsTypeOptions = useDataSourceTypeOptions();

    const formMap: Record<IDataSourceType, JSX.Element> = {
        [IDataSourceType.FILE]: (
            <FileData onDataLoading={onDataLoading} onClose={onClose} onDataLoaded={onDataLoaded} onLoadingFailed={onLoadingFailed} toggleLoadingAnimation={setLoadingAnimation} />
        ),
        [IDataSourceType.DEMO]: (
            <DemoData onClose={onClose} onDataLoaded={onDataLoaded} onLoadingFailed={onLoadingFailed} onStartLoading={onStartLoading} />
        ),
        [IDataSourceType.OLAP]: (
            <OLAPData onClose={onClose} onDataLoaded={onDataLoaded} />
        ),
        [IDataSourceType.RESTFUL]: (
            <JSONAPI onClose={onClose} onDataLoaded={onDataLoaded} onLoadingFailed={onLoadingFailed} onStartLoading={onStartLoading} />
            // <RestfulData onClose={onClose} onDataLoaded={onDataLoaded} onLoadingFailed={onLoadingFailed} onStartLoading={onStartLoading} />
        ),
        [IDataSourceType.LOCAL]: (
            <HistoryPanel onClose={onClose} onDataLoaded={onDataLoaded} onLoadingFailed={onLoadingFailed} />
        ),
        [IDataSourceType.DATABASE]: (
            <DatabaseConnector onClose={onClose} onDataLoaded={onDataLoaded} />
        ),
        [IDataSourceType.AIRTABLE]: (
            <AirTableSource onClose={onClose} onDataLoaded={onDataLoaded} onLoadingFailed={onLoadingFailed} onStartLoading={onStartLoading} />
        ),
    };

    return (
        <Modal containerClassName="vi-callout" onDismiss={onClose} isOpen={show}>
            <div className="vi-callout-header">
                <span className="vi-callout-title">{intl.get("dataSource.upload.title")}</span>
                <IconButton className="vi-callout-close-icon" iconProps={{ iconName: "Cancel" }} onClick={onClose} />
            </div>
            <div className="vi-callout-inner">
                <ChoiceGroup
                    options={dsTypeOptions}
                    selectedKey={dataSourceType}
                    onChange={(ev, option) => {
                        if (option) {
                            setDataSourceType(option.key as IDataSourceType);
                        }
                    }}
                />
                {loading && dataSourceType !== IDataSourceType.FILE && <ProgressIndicator description="loading" />}
                {loading && dataSourceType === IDataSourceType.FILE && <DataLoadingStatus />}
                {formMap[dataSourceType]}
            </div>
        </Modal>
    );
}

export default Selection;
