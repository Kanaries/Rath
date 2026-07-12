import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { FC, Fragment, useState } from 'react';
import styled from 'styled-components';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../../../components/ui/radio-group';
import { RathIcon } from '../../../components/icons';
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
            <Button
                variant="outline"
                onClick={() => {
                    causalStore.save().then((ok) => {
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
            >
                <RathIcon name="Save" />
                {intl.get('causal.actions.save_model')}
            </Button>
            <Button
                variant="outline"
                onClick={() => {
                    setShowModels(true);
                    causalStore.updateSaveKeys();
                }}
            >
                <RathIcon name="CloudDownload" />
                {intl.get('causal.actions.load_model')}
            </Button>
            <Dialog open={showModels} onOpenChange={setShowModels}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{intl.get('causal.analyze.my_models')}</DialogTitle>
                    </DialogHeader>
                    <ModalInnerContainer>
                        <div className="grid gap-2.5">
                            <Label>{intl.get('causal.analyze.model_list')}</Label>
                            <RadioGroup value={selectedModelKey} onValueChange={setSelectedModelKey}>
                                {saveKeys.map((key) => (
                                    <div className="flex items-center gap-2" key={key}>
                                        <RadioGroupItem id={`causal-model-${key}`} value={key} />
                                        <Label htmlFor={`causal-model-${key}`}>{key}</Label>
                                    </div>
                                ))}
                            </RadioGroup>
                            <Button
                                disabled={selectedModelKey === undefined}
                                onClick={() => {
                                    if (selectedModelKey) {
                                        causalStore.checkout(selectedModelKey);
                                    }
                                    setShowModels(false);
                                }}
                            >
                                {intl.get('common.apply')}
                            </Button>
                        </div>
                    </ModalInnerContainer>
                </DialogContent>
            </Dialog>
        </Fragment>
    );
};

export default observer(ModelStorage);
