import React, { useState } from 'react';
import { Modal, ChoiceGroup, IconButton } from 'office-ui-fabric-react';
import { useId } from '@uifabric/react-hooks';
import intl from 'react-intl-universal';
import { BIField, IDataSourceType, Record } from '../../../global';

import { useDataSourceTypeOptions } from '../config';
import FileData from './file';
import DemoData from './demo';

interface SelectionProps {
    show: boolean;
    onClose: () => void;
    onDataLoaded: (fields: BIField[], dataSource: Record[]) => void;
}
const Selection: React.FC<SelectionProps> = props => {
    const { show, onClose, onDataLoaded } = props;

    const [dataSourceType, setDataSourceType] = useState<IDataSourceType>(IDataSourceType.FILE);
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
                {dataSourceType === IDataSourceType.FILE && <FileData onClose={onClose} onDataLoaded={onDataLoaded} />}
                {dataSourceType === IDataSourceType.DEMO && <DemoData onClose={onClose} onDataLoaded={onDataLoaded} />}
            </div>
        </Modal>
    );
}

export default Selection;
