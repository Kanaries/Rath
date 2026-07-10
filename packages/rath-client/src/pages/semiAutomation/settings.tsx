import { observer } from 'mobx-react-lite';
import React, { useMemo } from 'react';
import intl from 'react-intl-universal';
import { Label } from '../../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../components/ui/sheet';
import { Switch } from '../../components/ui/switch';
import { useGlobalStore } from '../../store';
import OperationBar from './operationBar';

const PatternSetting: React.FC = () => {
    const { semiAutoStore } = useGlobalStore();
    const options = useMemo<Array<{ text: string; key: string }>>(() => {
        return [
            { text: intl.get('semiAuto.main.vizsys.lite'), key: 'lite' },
            { text: intl.get('semiAuto.main.vizsys.strict'), key: 'strict' },
        ];
    }, []);
    const { showSettings, settings, autoAsso } = semiAutoStore;
    const { vizAlgo } = settings;
    return (
        <Sheet open={showSettings} onOpenChange={(open) => !open && semiAutoStore.setShowSettings(false)}>
            <SheetContent className="w-[480px] overflow-y-auto sm:max-w-none">
                <SheetHeader>
                    <SheetTitle>{intl.get('common.settings')}</SheetTitle>
                </SheetHeader>
                <hr />
                <div className="grid gap-2">
                    <Label>{intl.get('semiAuto.main.vizsys.title')}</Label>
                    <RadioGroup
                        value={vizAlgo}
                        onValueChange={(value) => {
                            semiAutoStore.updateSettings('vizAlgo', value);
                        }}
                    >
                        {options.map((option) => (
                            <div className="flex items-center gap-2" key={option.key}>
                                <RadioGroupItem id={`semi-auto-viz-algo-${option.key}`} value={option.key} />
                                <Label htmlFor={`semi-auto-viz-algo-${option.key}`}>{option.text}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                </div>
                <hr style={{ marginTop: '1em' }} />
                <Label>Auto Prediction</Label>
                <div className="grid gap-3">
                    <div className="flex items-center justify-between gap-4">
                        <Label htmlFor="semi-auto-feat-views">features</Label>
                        <Switch
                            id="semi-auto-feat-views"
                            checked={autoAsso.featViews}
                            onCheckedChange={(checked) => {
                                semiAutoStore.updateAutoAssoConfig('featViews', Boolean(checked));
                            }}
                        />
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <Label htmlFor="semi-auto-patt-views">patterns</Label>
                        <Switch
                            id="semi-auto-patt-views"
                            checked={autoAsso.pattViews}
                            onCheckedChange={(checked) => {
                                semiAutoStore.updateAutoAssoConfig('pattViews', Boolean(checked));
                            }}
                        />
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <Label htmlFor="semi-auto-filter-views">subsets</Label>
                        <Switch
                            id="semi-auto-filter-views"
                            checked={autoAsso.filterViews}
                            onCheckedChange={(checked) => {
                                semiAutoStore.updateAutoAssoConfig('filterViews', Boolean(checked));
                            }}
                        />
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <Label htmlFor="semi-auto-neighbor-views">neighbors</Label>
                        <Switch
                            id="semi-auto-neighbor-views"
                            checked={autoAsso.neighborViews}
                            onCheckedChange={(checked) => {
                                semiAutoStore.updateAutoAssoConfig('neighborViews', Boolean(checked));
                            }}
                        />
                    </div>
                </div>
                <hr />
                <OperationBar />
            </SheetContent>
        </Sheet>
    );
};

export default observer(PatternSetting);
