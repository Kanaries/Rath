import { observer } from 'mobx-react-lite';
import intl from 'react-intl-universal'
import { Modal, ChoiceGroup, IconButton, ProgressIndicator, DefaultButton } from 'office-ui-fabric-react';
import React, { useCallback, useRef } from 'react';
import { useGlobalStore } from '../../../store';
import { loadRathStorageFile } from '../utils';
import { STORAGE_FILE_SUFFIX } from '../../../constants';

const ImportStorageSegment: React.FC = props => {
    const { ltsPipeLineStore, commonStore, dataSourceStore } = useGlobalStore();
    const fileRef = useRef<HTMLInputElement>(null);
    const uploadFile = useCallback(() => {
        if (fileRef.current && fileRef.current.files) {
            const file = fileRef.current.files[0];
            loadRathStorageFile(file).then(contents => {
                ltsPipeLineStore.importFromUploads({
                    dataContent: contents[1],
                    stateContent: contents[2]
                })
                // FIXME: 这里好乱啊，编解码的逻辑散的到处都是，有的需要parse有的不需要，很难维护。
                dataSourceStore.importStore(JSON.parse(contents[0]))
                commonStore.setShowStorageModal(false)
            }).catch(err => {
                commonStore.showError('error', err);
                commonStore.setShowStorageModal(false);
            })
        }
    }, [ltsPipeLineStore, commonStore, dataSourceStore])

    const onClose = useCallback(() => {
        commonStore.setShowStorageModal(false);
    }, [commonStore])

    return <Modal containerClassName="vi-callout" isOpen={commonStore.showStorageModal} onDismiss={onClose}>
        <div className="vi-callout-header">
        <span className="vi-callout-title">{intl.get('function.importStorage.title')}</span>
            <IconButton className="vi-callout-close-icon" iconProps={{ iconName: "Cancel" }} onClick={onClose} />
        </div>
        <div className="vi-callout-inner">
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
        </div>
    </Modal>
}

export default observer(ImportStorageSegment)