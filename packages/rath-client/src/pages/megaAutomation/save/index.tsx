import React, { useCallback, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { DefaultButton, Modal, PrimaryButton, Stack, TextField } from '@fluentui/react';
import dayjs from 'dayjs';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import { useGlobalStore } from '../../../store';
import { setStorageByIdInLocal } from '../../../utils/storage';
import { notify } from '../../../components/error';

const Container = styled.div`
    padding: 1em;
    .form-row {
        margin-bottom: 1em;
    }
    .form-button {
        margin-right: 1em;
    }
`;

const SaveModal: React.FC = (props) => {
    const { megaAutoStore } = useGlobalStore();
    const [name, setName] = useState<string>('');
    const { showSaveModal } = megaAutoStore;

    const saveInIndexDB = useCallback(() => {
        megaAutoStore
            .getStorageContent()
            .then((content) =>
                setStorageByIdInLocal(`[Rath_Storage]${dayjs().unix()}`, name === '' ? `[Rath_Storage]${dayjs().unix()}` : name, content)
            )
            .catch((err) => {
                notify({
                    type: 'error',
                    title: 'Error occurred',
                    content: `${err}`,
                });
            });
        megaAutoStore.setShowSaveModal(false);
    }, [megaAutoStore, name]);

    const closeModal = useCallback(() => {
        megaAutoStore.setShowSaveModal(false);
    }, [megaAutoStore]);

    return (
        <Modal isOpen={showSaveModal} onDismiss={closeModal}>
            <Container>
                <h2>{intl.get('function.save.title')}</h2>
                <div className="form-row">
                    <TextField
                        placeholder="Name"
                        label={intl.get('common.name')}
                        value={name}
                        onChange={(e, value) => {
                            value && setName(value);
                        }}
                    />
                </div>
                <Stack horizontal>
                    <PrimaryButton className="form-button" text={intl.get('function.confirm')} onClick={saveInIndexDB} />
                    <DefaultButton className="form-button" text={intl.get('function.cancel')} onClick={closeModal} />
                </Stack>
            </Container>
        </Modal>
    );
};

export default observer(SaveModal);
