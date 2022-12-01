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
                text="保存因果模型"
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
                text="导入因果模型"
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
                        <Label>我的模型</Label>
                        <ChoiceGroup
                            label="模型列表"
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
                            text="使用"
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
