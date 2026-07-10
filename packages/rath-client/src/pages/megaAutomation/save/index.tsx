import React, { useCallback, useState } from 'react';
import { observer } from 'mobx-react-lite';
import dayjs from 'dayjs';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
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
        <Dialog
            open={showSaveModal}
            onOpenChange={(open) => {
                if (!open) {
                    closeModal();
                }
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{intl.get('function.save.title')}</DialogTitle>
                </DialogHeader>
                <Container>
                    <div className="form-row">
                        <Label htmlFor="mega-auto-save-name">{intl.get('common.name')}</Label>
                        <Input
                            id="mega-auto-save-name"
                            placeholder="Name"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                            }}
                        />
                    </div>
                    <div className="flex">
                        <Button className="form-button" onClick={saveInIndexDB}>
                            {intl.get('function.confirm')}
                        </Button>
                        <Button className="form-button" variant="outline" onClick={closeModal}>
                            {intl.get('function.cancel')}
                        </Button>
                    </div>
                </Container>
            </DialogContent>
        </Dialog>
    );
};

export default observer(SaveModal);
