import { observer } from 'mobx-react-lite';
import { FC } from 'react';
import intl from 'react-intl-universal';
import { RathIcon } from '../../components/icons';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { useGlobalStore } from '../../store';

const DataInfo: FC = () => {
    const { dataSourceStore } = useGlobalStore();
    const { cleanedData, rawDataMetaInfo, filteredDataMetaInfo, mutFields, fieldMetas } = dataSourceStore;

    return (
        <Alert variant="info" role="status">
            <RathIcon name="Info" className="shrink-0 text-message-icon" />
            <AlertDescription>
                {intl.get('dataSource.rowsInViews', {
                    origin: rawDataMetaInfo.length,
                    originCols: mutFields.length,
                    select: filteredDataMetaInfo.length,
                    selectCols: fieldMetas.length,
                    clean: cleanedData.length,
                })}
            </AlertDescription>
        </Alert>
    );
};

export default observer(DataInfo);
