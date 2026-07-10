import React, { useState } from 'react';
import intl from 'react-intl-universal';
import { IDataSourceType } from '../../../global';
import { IMuteFieldBase, IRow } from '../../../interfaces';
import { useDataSourceTypeOptions } from '../config';
import DataLoadingStatus from '../dataLoadingStatus';
import type { DataSourceTag, IDBMeta } from '../../../utils/storage';
import DatabaseConnector from '../../dataConnection/database/main';
import { RathIcon } from '../../../components/icons';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Spinner } from '../../../components/ui/spinner';
import { cn } from '../../../utils/cn';
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
    onDataLoaded: (
        fields: IMuteFieldBase[],
        dataSource: IRow[],
        name?: string,
        tag?: DataSourceTag | undefined,
        withHistory?: IDBMeta | undefined
    ) => void;
    onDataLoading: (p: number) => void;
    setLoadingAnimation: (on: boolean) => void;
}

const Selection: React.FC<SelectionProps> = (props) => {
    const { show, onClose, onDataLoaded, loading, onStartLoading, onLoadingFailed, onDataLoading, setLoadingAnimation } = props;

    const [dataSourceType, setDataSourceType] = useState<IDataSourceType>(IDataSourceType.LOCAL);
    const dsTypeOptions = useDataSourceTypeOptions();

    const formMap: Record<IDataSourceType, JSX.Element> = {
        [IDataSourceType.FILE]: (
            <FileData
                onDataLoading={onDataLoading}
                onClose={onClose}
                onDataLoaded={onDataLoaded}
                onLoadingFailed={onLoadingFailed}
                toggleLoadingAnimation={setLoadingAnimation}
            />
        ),
        [IDataSourceType.DEMO]: (
            <DemoData onClose={onClose} onDataLoaded={onDataLoaded} onLoadingFailed={onLoadingFailed} onStartLoading={onStartLoading} />
        ),
        [IDataSourceType.OLAP]: <OLAPData onClose={onClose} onDataLoaded={onDataLoaded} />,
        [IDataSourceType.RESTFUL]: (
            <JSONAPI onClose={onClose} onDataLoaded={onDataLoaded} onLoadingFailed={onLoadingFailed} onStartLoading={onStartLoading} />
            // <RestfulData onClose={onClose} onDataLoaded={onDataLoaded} onLoadingFailed={onLoadingFailed} onStartLoading={onStartLoading} />
        ),
        [IDataSourceType.LOCAL]: <HistoryPanel onClose={onClose} onDataLoaded={onDataLoaded} onLoadingFailed={onLoadingFailed} />,
        [IDataSourceType.DATABASE]: <DatabaseConnector onClose={onClose} onDataLoaded={onDataLoaded} />,
        [IDataSourceType.AIRTABLE]: (
            <AirTableSource onClose={onClose} onDataLoaded={onDataLoaded} onLoadingFailed={onLoadingFailed} onStartLoading={onStartLoading} />
        ),
    };

    return (
        <Dialog
            open={show}
            onOpenChange={(open) => {
                if (!open) {
                    onClose();
                }
            }}
        >
            <DialogContent className="flex max-h-[calc(100vh-2rem)] w-[min(72rem,calc(100vw-2rem))] max-w-none flex-col gap-0 overflow-hidden p-0">
                <DialogHeader className="shrink-0 px-6 pb-4 pt-6">
                    <DialogTitle className="text-[21px] font-light leading-7">{intl.get('dataSource.upload.title')}</DialogTitle>
                </DialogHeader>
                <div
                    role="tablist"
                    aria-label={intl.get('dataSource.upload.title')}
                    className="grid shrink-0 grid-cols-2 gap-2 px-6 pb-5 sm:grid-cols-4 lg:grid-cols-7"
                >
                    {dsTypeOptions.map((option) => {
                        const selected = option.key === dataSourceType;
                        return (
                            <button
                                key={option.key}
                                type="button"
                                role="tab"
                                aria-selected={selected}
                                aria-controls="data-source-panel"
                                id={`data-source-tab-${option.key}`}
                                disabled={option.disabled}
                                className={cn(
                                    'relative flex min-h-24 flex-col items-center justify-center gap-2 rounded-sm border bg-muted/40 px-2 py-3 text-sm transition-colors',
                                    'hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                                    selected && 'border-foreground bg-background shadow-sm',
                                    option.disabled && 'cursor-not-allowed opacity-40'
                                )}
                                onClick={() => setDataSourceType(option.key)}
                            >
                                {selected && <span className="absolute right-2 top-2 h-3 w-3 rounded-full border-[3px] border-foreground" />}
                                <RathIcon name={option.icon} size={34} strokeWidth={1.5} />
                                <span>{option.text}</span>
                            </button>
                        );
                    })}
                </div>
                <div
                    id="data-source-panel"
                    role="tabpanel"
                    aria-labelledby={`data-source-tab-${dataSourceType}`}
                    className="min-h-0 flex-1 overflow-y-auto border-t px-6 pb-5 pt-4"
                >
                    {loading && dataSourceType !== IDataSourceType.FILE && (
                        <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                            <Spinner />
                            <span>loading</span>
                        </div>
                    )}
                    {loading && dataSourceType === IDataSourceType.FILE && <DataLoadingStatus />}
                    {formMap[dataSourceType]}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default Selection;
