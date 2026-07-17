import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { FC, Fragment, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import { Label } from '../../../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../../../components/ui/radio-group';
import { RathIcon } from '../../../components/icons';
import { notify } from '../../../components/error';
import { useGlobalStore } from '../../../store';

const ModelStorage: FC = () => {
    const { causalStore } = useGlobalStore();
    const { saveKeys } = causalStore;
    const [selectedModelKey, setSelectedModelKey] = useState<string | undefined>(undefined);
    const [showModels, setShowModels] = useState<boolean>(false);

    const handleSave = () => {
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
    };

    return (
        <Fragment>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-1.5">
                        <RathIcon name="Database" />
                        {intl.get('causal.actions.model')}
                        <RathIcon name="CaretSolidDown" size={12} className="text-muted-foreground" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={handleSave}>
                        <RathIcon name="Save" className="mr-2" />
                        {intl.get('causal.actions.save_model')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => {
                            setShowModels(true);
                            causalStore.updateSaveKeys();
                        }}
                    >
                        <RathIcon name="CloudDownload" className="mr-2" />
                        {intl.get('causal.actions.load_model')}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <Dialog open={showModels} onOpenChange={setShowModels}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{intl.get('causal.analyze.my_models')}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-2.5 p-4">
                        <Label>{intl.get('causal.analyze.model_list')}</Label>
                        {saveKeys.length === 0 && <p className="text-sm text-muted-foreground">{intl.get('causal.status.no_saved_model')}</p>}
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
                </DialogContent>
            </Dialog>
        </Fragment>
    );
};

export default observer(ModelStorage);
