import React, { useState } from 'react';
import { Modal, ChoiceGroup, IconButton, ProgressIndicator } from 'office-ui-fabric-react';
import { useId } from '@uifabric/react-hooks';
import intl from 'react-intl-universal';
import { IDataSourceType } from '../../../global';

import { useDataSourceTypeOptions } from '../config';
import FileData from './file';
import DemoData from './demo';
import RestfulData from './restful';
import ClickHouseData from './clickhouse';
import { IMuteFieldBase, IRow } from '../../../interfaces';
import Local from './local';
import DataLoadingStatus from '../dataLoadingStatus';

interface SelectionProps {
    show: boolean;
    loading: boolean;
    onClose: () => void;
    onStartLoading: () => void;
    onLoadingFailed: (err: any) => void;
    onDataLoaded: (fields: IMuteFieldBase[], dataSource: IRow[]) => void;
    onDataLoading: (p: number) => void;
}
const Selection: React.FC<SelectionProps> = props => {
    const { show, onClose, onDataLoaded, loading, onStartLoading, onLoadingFailed, onDataLoading } = props;

    const [dataSourceType, setDataSourceType] = useState<IDataSourceType>(IDataSourceType.DEMO);
    const dsTypeOptions = useDataSourceTypeOptions();

    const dsTypeLabelId = useId('dataSourceType');


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
                    ariaLabelledBy={dsTypeLabelId}
                />
                {loading && dataSourceType !== IDataSourceType.FILE && <ProgressIndicator description="loading" />}
                {loading && dataSourceType === IDataSourceType.FILE && <DataLoadingStatus />}
                {dataSourceType === IDataSourceType.FILE && <FileData onDataLoading={onDataLoading} onClose={onClose} onDataLoaded={onDataLoaded} onLoadingFailed={onLoadingFailed} onStartLoading={onStartLoading} />}
                {dataSourceType === IDataSourceType.DEMO && <DemoData onClose={onClose} onDataLoaded={onDataLoaded} onLoadingFailed={onLoadingFailed} onStartLoading={onStartLoading} />}
                {dataSourceType === IDataSourceType.CLICKHOUSE && <ClickHouseData onClose={onClose} onDataLoaded={onDataLoaded} />}
                {dataSourceType === IDataSourceType.RESTFUL && <RestfulData onClose={onClose} onDataLoaded={onDataLoaded} onLoadingFailed={onLoadingFailed} onStartLoading={onStartLoading} />}
                {dataSourceType === IDataSourceType.LOCAL && <Local onClose={onClose} onDataLoaded={onDataLoaded} onLoadingFailed={onLoadingFailed} onStartLoading={onStartLoading} />}
            </div>
        </Modal>
    );
}

export default Selection;
