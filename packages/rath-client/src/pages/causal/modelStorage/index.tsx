import intl from 'react-intl-universal';
import { ChoiceGroup, DefaultButton, Label, Modal, PrimaryButton, Stack } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import { FC, Fragment, useState } from 'react';
import styled from 'styled-components';
import { notify } from '../../../components/error';
import { useGlobalStore } from '../../../store';

const ModalInnerContainer = styled.div`
    padding: 1em;
`;

const ModelStorage: FC = () => {
    const { causalStore } = useGlobalStore();
    const { saveKeys } = causalStore;
    const [selectedModelKey, setSelectedModelKey] = useState<string | undefined>(undefined);
    const [showModels, setShowModels] = useState<boolean>(false);
    return (
        <Fragment>
            <DefaultButton
                text={intl.get('causal.actions.save_model')}
                iconProps={{ iconName: 'Save' }}
                onClick={() => {
                    causalStore.save().then(ok => {
                        if (ok) {
                            notify({
                                title: 'Causal Model Saved',
                                content: 'Causal model saved successfully.',
                                type: 'success',
                            });
                        } else {
                            notify({
                                title: 'Causal Model Save Failed',
                                content: 'DatasetId is null.',
                                type: 'error',
                            });
                        }
                    });
                }}
            />
            <DefaultButton
                text={intl.get('causal.actions.load_model')}
                iconProps={{ iconName: 'CloudDownload' }}
                onClick={() => {
                    setShowModels(true);
                    causalStore.updateSaveKeys();
                }}
            />
            <Modal
                isOpen={showModels}
                onDismiss={() => {
                    setShowModels(false);
                }}
            >
                <ModalInnerContainer>
                    <Stack tokens={{ childrenGap: 10 }}>
                        <Label>{intl.get('causal.analyze.my_models')}</Label>
                        <ChoiceGroup
                            label={intl.get('causal.analyze.model_list')}
                            value={selectedModelKey}
                            options={saveKeys.map((key) => {
                                return {
                                    key,
                                    text: key,
                                };
                            })}
                            onChange={(e, op) => {
                                op && setSelectedModelKey(op.key);
                            }}
                        />
                        <PrimaryButton
                            disabled={selectedModelKey === undefined}
                            text={intl.get('common.apply')}
                            onClick={() => {
                                if (selectedModelKey) {
                                    causalStore.checkout(selectedModelKey);
                                }
                                setShowModels(false);
                            }}
                        />
                    </Stack>
                </ModalInnerContainer>
            </Modal>
        </Fragment>
    );
};

export default observer(ModelStorage);
