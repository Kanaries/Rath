import { observer } from 'mobx-react-lite';
import { FC } from 'react';
import intl from 'react-intl-universal';
import { MessageBar } from '@fluentui/react';
import { useGlobalStore } from '../../store';

const DataInfo: FC = () => {
    const { dataSourceStore } = useGlobalStore();
    const { cleanedData, rawDataMetaInfo, filteredDataMetaInfo, mutFields, fieldMetas } = dataSourceStore;

    return <MessageBar>
        {intl.get('dataSource.rowsInViews', {
            origin: rawDataMetaInfo.length,
            originCols: mutFields.length,
            select: filteredDataMetaInfo.length,
            selectCols: fieldMetas.length,
            clean: cleanedData.length,
        })}
    </MessageBar>;
};

export default observer(DataInfo);