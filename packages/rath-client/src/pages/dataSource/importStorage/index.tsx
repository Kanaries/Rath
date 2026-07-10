import { observer } from 'mobx-react-lite';
import intl from 'react-intl-universal';
import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import dayjs from 'dayjs';
import styled from 'styled-components';
import { runInAction } from 'mobx';
import { useGlobalStore } from '../../../store';
import { loadRathStorageFile } from '../utils';
import { STORAGE_FILE_SUFFIX } from '../../../constants';
import {
    deleteStorageByIdInLocal,
    getStorageByIdInLocal,
    getStorageListInLocal,
    IDBMeta,
    IRathStorage,
    RathStorageParse,
} from '../../../utils/storage';
import { notify } from '../../../components/error';
import { RathIcon } from '../../../components/icons';
import { RathColumn, RathDataTable } from '../../../components/rath-ui/rath-data-table';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '../../../components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '../../../components/ui/tabs';

const OperationStack = styled.div`
    display: flex;
    flex-direction: row;
    .ope-icon {
        cursor: pointer;
        margin-right: 12px;
    }
    .blue {
        color: #0078d4;
    }
    .red {
        color: #d13438;
    }
`;

enum STORAGE_MODE {
    INDEXDB = 'indexdb',
    FILE = 'FILE',
}

const ImportStorageSegment: React.FC = (props) => {
    const { ltsPipeLineStore, commonStore, dataSourceStore } = useGlobalStore();
    const { showStorageModal } = commonStore;
    const fileRef = useRef<HTMLInputElement>(null);

    const [metas, setMetas] = useState<IDBMeta[]>([]);
    const [mode, setMode] = useState<STORAGE_MODE>(STORAGE_MODE.INDEXDB);

    const importStorage = useCallback(
        (sto: IRathStorage) => {
            runInAction(() => {
                dataSourceStore.importStore(JSON.parse(sto.appStorage));
                ltsPipeLineStore.importFromUploads({
                    dataStorage: sto.dataStorage,
                    engineStorage: sto.engineStorage,
                });
            });
        },
        [ltsPipeLineStore, dataSourceStore]
    );

    const uploadFile = useCallback(() => {
        if (fileRef.current && fileRef.current.files) {
            const file = fileRef.current.files[0];
            loadRathStorageFile(file)
                .then((sto) => {
                    importStorage(sto);
                    commonStore.setShowStorageModal(false);
                })
                .catch((err) => {
                    notify({
                        type: 'error',
                        title: 'Error occurred',
                        content: `${err}`,
                    });
                    commonStore.setShowStorageModal(false);
                });
        }
    }, [commonStore, importStorage]);

    const onClose = useCallback(() => {
        commonStore.setShowStorageModal(false);
    }, [commonStore]);

    const loadStorage = useCallback(
        (sid: string) => {
            getStorageByIdInLocal(sid)
                .then((content) => {
                    const sto = RathStorageParse(content);
                    importStorage(sto);
                    commonStore.setShowStorageModal(false);
                })
                .catch((err) => {
                    notify({
                        type: 'error',
                        title: 'Error occurred',
                        content: `${err}`,
                    });
                    commonStore.setShowStorageModal(false);
                });
        },
        [importStorage, commonStore]
    );

    const deleteStorage = useCallback((sid: string) => {
        deleteStorageByIdInLocal(sid)
            .then(() => {
                setMetas((ms) => {
                    return ms.filter((m) => m.id !== sid);
                });
            })
            .catch((err) => {
                notify({
                    type: 'error',
                    title: 'Error occurred',
                    content: `${err}`,
                });
            });
    }, []);

    const STORAGE_COLUMNS = useMemo<RathColumn<IDBMeta>[]>(() => {
        return [
            {
                key: 'name',
                name: intl.get('function.importStorage.storageColumns.name'),
                fieldName: 'name',
                minWidth: 320,
            },
            {
                key: 'createTime',
                name: intl.get('function.importStorage.storageColumns.createTime'),
                fieldName: 'createTime',
                minWidth: 100,
                onRender(item) {
                    return dayjs(item['createTime']).format('YYYY/MM/DD HH:mm');
                },
            },
            {
                key: 'size',
                name: intl.get('function.importStorage.storageColumns.size'),
                fieldName: 'size',
                minWidth: 50,
                onRender(item) {
                    return `${item['size'] || 0} KB`;
                },
            },
            {
                key: 'operation',
                name: intl.get('function.importStorage.storageColumns.operation'),
                minWidth: 100,
                onRender(item, index) {
                    return (
                        <OperationStack>
                            <RathIcon
                                className="blue ope-icon"
                                name="CloudDownload"
                                onClick={() => {
                                    loadStorage(item['id']);
                                }}
                            />
                            <RathIcon
                                className="red ope-icon"
                                name="delete"
                                onClick={() => {
                                    deleteStorage(item['id']);
                                }}
                            />
                        </OperationStack>
                    );
                },
            },
        ];
    }, [loadStorage, deleteStorage]);

    useEffect(() => {
        getStorageListInLocal().then((list) => {
            setMetas(list);
        });
    }, [showStorageModal]);

    return (
        <Dialog
            open={showStorageModal}
            onOpenChange={(open) => {
                if (!open) {
                    onClose();
                }
            }}
        >
            <DialogContent className="flex max-h-[calc(100vh-2rem)] min-w-[min(42rem,calc(100vw-2rem))] flex-col gap-0 overflow-hidden p-0">
                <div className="shrink-0 px-6 pb-4 pt-6">
                    <DialogTitle className="text-[21px] font-light leading-7">{intl.get('function.importStorage.title')}</DialogTitle>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-5">
                    <Tabs value={mode} onValueChange={(value) => setMode(value as STORAGE_MODE)}>
                        <TabsList>
                            <TabsTrigger value={STORAGE_MODE.INDEXDB}>{intl.get('function.importStorage.type.indexdb')}</TabsTrigger>
                            <TabsTrigger value={STORAGE_MODE.FILE}>{intl.get('function.importStorage.type.file')}</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    {mode === STORAGE_MODE.INDEXDB && (
                        <div>
                            <RathDataTable columns={STORAGE_COLUMNS} items={metas} />
                        </div>
                    )}
                    {mode === STORAGE_MODE.FILE && (
                        <div>
                            <input ref={fileRef} type="file" accept="*" onChange={uploadFile} style={{ display: 'none' }} />
                            <p className="vi-description">
                                {intl.get('function.importStorage.desc')}(*.{STORAGE_FILE_SUFFIX})
                            </p>
                            <Button
                                variant="outline"
                                className="mt-[1em]"
                                onClick={() => {
                                    if (fileRef.current) {
                                        fileRef.current.click();
                                    }
                                }}
                            >
                                <RathIcon name="upload" className="mr-1" />
                                {intl.get('function.upload')}
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default observer(ImportStorageSegment);
