import { observer } from 'mobx-react-lite';
import intl from 'react-intl-universal'
import { Modal, IconButton, Icon, SelectionMode, DefaultButton, IColumn, DetailsList, Stack, Pivot, PivotItem } from '@fluentui/react';
import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import dayjs from 'dayjs';
import styled from 'styled-components';
import { runInAction } from 'mobx';
import { useGlobalStore } from '../../../store';
import { loadRathStorageFile } from '../utils';
import { STORAGE_FILE_SUFFIX } from '../../../constants';
import { deleteStorageByIdInLocal, getStorageByIdInLocal, getStorageListInLocal, IDBMeta, IRathStorage, RathStorageParse } from '../../../utils/storage';
import { notify } from '../../../components/error';

const OperationStack = styled(Stack)`
    .ope-icon{
        cursor: pointer;
        margin-right: 12px;
    }
    .blue{
        color: #0078d4;
    }
    .red{
        color: #d13438;
    }
`

enum STORAGE_MODE {
    INDEXDB = 'indexdb',
    FILE = 'FILE'
}

const ImportStorageSegment: React.FC = props => {
    const { ltsPipeLineStore, commonStore, dataSourceStore } = useGlobalStore();
    const { showStorageModal } = commonStore;
    const fileRef = useRef<HTMLInputElement>(null);

    const [metas, setMetas] = useState<IDBMeta[]>([]);
    const [mode, setMode] = useState<STORAGE_MODE>(STORAGE_MODE.INDEXDB)

    const importStorage = useCallback((sto: IRathStorage) => {
        runInAction(() => {
            dataSourceStore.importStore(JSON.parse(sto.appStorage))
            ltsPipeLineStore.importFromUploads({
                dataStorage: sto.dataStorage,
                engineStorage: sto.engineStorage
            })
        })
    }, [ltsPipeLineStore, dataSourceStore])

    const uploadFile = useCallback(() => {
        if (fileRef.current && fileRef.current.files) {
            const file = fileRef.current.files[0];
            loadRathStorageFile(file).then(sto => {
                importStorage(sto);
                commonStore.setShowStorageModal(false)
            }).catch(err => {
                notify({
                    type: 'error',
                    title: 'Error occurred',
                    content: `${err}`,
                });
                commonStore.setShowStorageModal(false);
            })
        }
    }, [commonStore, importStorage])

    const onClose = useCallback(() => {
        commonStore.setShowStorageModal(false);
    }, [commonStore])

    const loadStorage = useCallback((sid: string) => {
        getStorageByIdInLocal(sid).then(content => {
            const sto = RathStorageParse(content);
            importStorage(sto)
            commonStore.setShowStorageModal(false)
        }).catch(err => {
            notify({
                type: 'error',
                title: 'Error occurred',
                content: `${err}`,
            });
            commonStore.setShowStorageModal(false)
        })
    }, [importStorage, commonStore])

    const deleteStorage = useCallback((sid: string) => {
        deleteStorageByIdInLocal(sid).then(() => {
            setMetas(ms => {
                return ms.filter(m => m.id !== sid);
            })
        }).catch(err => {
            notify({
                type: 'error',
                title: 'Error occurred',
                content: `${err}`,
            });
        })
    }, [])

    const STORAGE_COLUMNS = useMemo<IColumn[]>(() => {
        return [
            {
                key: 'name',
                name: intl.get('function.importStorage.storageColumns.name'),
                fieldName: 'name',
                minWidth: 320
            },
            {
                key: 'createTime',
                name: intl.get('function.importStorage.storageColumns.createTime'),
                fieldName: 'createTime',
                minWidth: 100,
                onRender(item) {
                    return dayjs(item['createTime']).format('YYYY/MM/DD HH:mm')
                }
            },
            {
                key: 'size',
                name: intl.get('function.importStorage.storageColumns.size'),
                fieldName: 'size',
                minWidth: 50,
                onRender(item) {
                    return `${item['size'] || 0} KB`
                }
            },
            {
                key: 'operation',
                name: intl.get('function.importStorage.storageColumns.operation'),
                minWidth: 100,
                onRender(item, index) {
                    return <OperationStack horizontal>
                        <Icon className="blue ope-icon" iconName="CloudDownload" onClick={() => {
                            loadStorage(item['id'])
                        }} />
                        <Icon className="red ope-icon" iconName="delete" onClick={() => {
                            deleteStorage(item['id'])
                        }} />
                    </OperationStack>
                }
            }
        ]
    }, [loadStorage, deleteStorage])

    useEffect(() => {
        getStorageListInLocal().then(list => {
            setMetas(list);
        })
    }, [showStorageModal])

    return <Modal containerClassName="vi-callout" isOpen={showStorageModal} onDismiss={onClose}>
        <div className="vi-callout-header">
            <span className="vi-callout-title">{intl.get('function.importStorage.title')}</span>
            <IconButton className="vi-callout-close-icon" iconProps={{ iconName: "Cancel" }} onClick={onClose} />
        </div>
        <div className="vi-callout-inner">
            <Pivot selectedKey={mode} onLinkClick={(item) => {
                if (item) {
                    setMode(item.props.itemKey as STORAGE_MODE)
                }
            }}>
                <PivotItem headerText={intl.get('function.importStorage.type.indexdb')} itemKey={STORAGE_MODE.INDEXDB} />
                <PivotItem headerText={intl.get('function.importStorage.type.file')} itemKey={STORAGE_MODE.FILE} />
            </Pivot>
            {mode === STORAGE_MODE.INDEXDB && <div>
                <DetailsList
                    columns={STORAGE_COLUMNS}
                    items={metas}
                    selectionMode={SelectionMode.none}
                />
            </div>}
            {mode === STORAGE_MODE.FILE && <div>
                <input ref={fileRef} type="file" accept="*" onChange={uploadFile} style={{ display: 'none' }} />
                <p className="vi-description">{intl.get('function.importStorage.desc')}(*.{STORAGE_FILE_SUFFIX})</p>
                <DefaultButton
                    iconProps={{ iconName: 'upload' }}
                    text={intl.get('function.upload')}
                    style={{ marginTop: '1em' }}
                    onClick={() => {
                        if (fileRef.current) {
                            fileRef.current.click();
                        }
                    }}
                />
            </div>}
        </div>
    </Modal>
}

export default observer(ImportStorageSegment)