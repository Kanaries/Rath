import { ChoiceGroup, DefaultButton, Label, Modal, PrimaryButton, Stack } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import React, { Fragment, useState } from 'react';
import styled from 'styled-components';
import { notify } from '../../../components/error';
import { useGlobalStore } from '../../../store';

const ModalInnerContainer = styled.div`
    padding: 1em;
`;

interface ModelStorageProps {}
const ModelStorage: React.FC<ModelStorageProps> = (props) => {
    const { causalStore } = useGlobalStore();
    const { userModelKeys } = causalStore;
    const [selectedModelKey, setSelectedModelKey] = useState<string | undefined>(undefined);
    const [showModels, setShowModels] = useState<boolean>(false);
    return (
        <Fragment>
            <DefaultButton
                text="Save Causal Model"
                iconProps={{ iconName: 'Save' }}
                onClick={() => {
                    causalStore
                        .saveCausalModel()
                        .then(() => {
                            notify({
                                title: 'Causal Model Saved',
                                content: 'Causal model saved successfully.',
                                type: 'success',
                            });
                        })
                        .catch((err) => {
                            notify({
                                title: 'Causal Model Save Failed',
                                content: `${err}`,
                                type: 'error',
                            });
                        });
                }}
            />
            <DefaultButton
                text="Load Causal Model"
                iconProps={{ iconName: 'CloudDownload' }}
                onClick={() => {
                    setShowModels(true);
                    causalStore.getCausalModelList();
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
                        <Label>History Models</Label>
                        <ChoiceGroup
                            label="models"
                            value={selectedModelKey}
                            options={userModelKeys.map((key) => {
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
                            text="Load"
                            onClick={() => {
                                if (selectedModelKey) {
                                    causalStore.fetchCausalModel(selectedModelKey);
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
