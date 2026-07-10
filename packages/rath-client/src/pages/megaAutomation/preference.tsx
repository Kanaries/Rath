import React, { useCallback, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import intl from 'react-intl-universal';
import { runInAction } from 'mobx';
import { RathSelect, RathSelectOption } from '../../components/rath-ui/rath-select';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Slider } from '../../components/ui/slider';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '../../components/ui/sheet';
import { Switch } from '../../components/ui/switch';
import { useGlobalStore } from '../../store';
import { EXPLORE_VIEW_ORDER } from '../../store/megaAutomation';
import { IResizeMode } from '../../interfaces';

const PreferencePanel: React.FC = () => {
    const { megaAutoStore } = useGlobalStore();
    const { visualConfig, showPreferencePannel, nlgThreshold, vizMode } = megaAutoStore;

    const { nlg, viewSizeLimit } = visualConfig;

    const orderOptions: RathSelectOption[] = Object.values(EXPLORE_VIEW_ORDER).map((or) => ({
        text: intl.get(`megaAuto.orderBy.${or}`),
        key: or,
    }));

    const resizeModeList = useMemo<RathSelectOption[]>(() => {
        return [
            {
                text: intl.get('megaAuto.operation.resizeMode.none'),
                key: IResizeMode.auto,
            },
            {
                text: intl.get('megaAuto.operation.resizeMode.resizable'),
                key: IResizeMode.control,
            },
        ];
    }, []);

    const closeVisualPannel = useCallback(() => {
        megaAutoStore.setShowPreferencePannel(false);
    }, [megaAutoStore]);

    const submitChange = useCallback(() => {
        runInAction(() => {
            megaAutoStore.setShowPreferencePannel(false);
            megaAutoStore.refreshMainViewSpec();
        });
    }, [megaAutoStore]);

    const vizModeOptions = useMemo<Array<{ text: string; key: 'lite' | 'strict' }>>(() => {
        return [
            { text: intl.get('semiAuto.main.vizsys.lite'), key: 'lite' },
            { text: intl.get('semiAuto.main.vizsys.strict'), key: 'strict' },
        ];
    }, []);

    return (
        <Sheet open={showPreferencePannel} onOpenChange={(open) => !open && closeVisualPannel()}>
            <SheetContent className="flex w-[340px] flex-col sm:max-w-none">
                <SheetHeader>
                    <SheetTitle>{intl.get('preference.config')}</SheetTitle>
                </SheetHeader>
                <div className="grid flex-1 gap-4 overflow-y-auto">
                    <div className="grid gap-2">
                        <Label htmlFor="mega-auto-view-measure-limit">Default SpinButton</Label>
                        <Input
                            id="mega-auto-view-measure-limit"
                            type="number"
                            value={viewSizeLimit.measure.toString()}
                            min={1}
                            max={20}
                            step={1}
                            onChange={(e) => {
                                megaAutoStore.setVisualConig((cnf) => {
                                    cnf.viewSizeLimit.measure = Number(e.target.value);
                                });
                            }}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>{intl.get('semiAuto.main.vizsys.title')}</Label>
                        <RadioGroup
                            value={vizMode}
                            onValueChange={(value) => {
                                megaAutoStore.setVizMode(value as 'lite' | 'strict');
                            }}
                        >
                            {vizModeOptions.map((option) => (
                                <div className="flex items-center gap-2" key={option.key}>
                                    <RadioGroupItem id={`mega-auto-viz-mode-${option.key}`} value={option.key} />
                                    <Label htmlFor={`mega-auto-viz-mode-${option.key}`}>{option.text}</Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>
                    <div>
                        <RathSelect
                            className="min-w-[120px]"
                            selectedKey={megaAutoStore.orderBy}
                            options={orderOptions}
                            label={intl.get('megaAuto.orderBy.title')}
                            onChange={(key) => {
                                megaAutoStore.setExploreOrder(key as string);
                            }}
                        />
                    </div>
                    <div className="grid gap-3">
                        <div className="flex items-center justify-between gap-4">
                            <Label htmlFor="mega-auto-exclude-scale-zero">{intl.get('megaAuto.operation.excludeScaleZero')}</Label>
                            <Switch
                                id="mega-auto-exclude-scale-zero"
                                checked={visualConfig.excludeScaleZero}
                                onCheckedChange={(checked) => {
                                    megaAutoStore.setVisualConig((cnf) => {
                                        cnf.excludeScaleZero = Boolean(checked);
                                    });
                                }}
                            />
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <Label htmlFor="mega-auto-debug">{intl.get('megaAuto.operation.debug')}</Label>
                            <Switch
                                id="mega-auto-debug"
                                checked={visualConfig.debug}
                                onCheckedChange={(checked) => {
                                    megaAutoStore.setVisualConig((cnf) => {
                                        cnf.debug = Boolean(checked);
                                    });
                                }}
                            />
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <Label htmlFor="mega-auto-zoom">{intl.get('megaAuto.operation.zoom')}</Label>
                            <Switch
                                id="mega-auto-zoom"
                                checked={visualConfig.zoom}
                                onCheckedChange={(checked) => {
                                    megaAutoStore.setVisualConig((cnf) => {
                                        cnf.zoom = Boolean(checked);
                                    });
                                }}
                            />
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <Label htmlFor="mega-auto-nlg">NLG(beta)</Label>
                            <Switch
                                id="mega-auto-nlg"
                                checked={visualConfig.nlg}
                                onCheckedChange={(checked) => {
                                    megaAutoStore.setVisualConig((cnf) => {
                                        cnf.nlg = Boolean(checked);
                                    });
                                }}
                            />
                        </div>
                        <div className="grid gap-2">
                            <div className="flex items-center justify-between gap-4">
                                <Label>NLG Threshold(beta)</Label>
                                <span className="text-sm text-muted-foreground">{Math.round(nlgThreshold * 100)}%</span>
                            </div>
                            <Slider
                                disabled={!nlg}
                                value={[nlgThreshold]}
                                min={0}
                                max={1}
                                step={0.01}
                                onValueChange={(value) => {
                                    megaAutoStore.setNlgThreshold(value[0]);
                                }}
                            />
                        </div>
                        <div>
                            <RathSelect
                                selectedKey={visualConfig.resize}
                                label={intl.get('megaAuto.operation.resize')}
                                options={resizeModeList}
                                onChange={(key) => {
                                    megaAutoStore.setVisualConig((cnf) => {
                                        cnf.resize = key as any;
                                    });
                                }}
                            />
                        </div>
                        {visualConfig.resize === IResizeMode.control && (
                            <div className="grid gap-2">
                                <Label htmlFor="mega-auto-resize-width">width</Label>
                                <Input
                                    id="mega-auto-resize-width"
                                    type="number"
                                    value={visualConfig.resizeConfig.width.toString()}
                                    min={0}
                                    max={1000}
                                    step={10}
                                    onChange={(e) => {
                                        megaAutoStore.setVisualConig((cnf) => {
                                            cnf.resizeConfig.width = parseInt(e.target.value, 10);
                                        });
                                    }}
                                />
                            </div>
                        )}
                        {visualConfig.resize === IResizeMode.control && (
                            <div className="grid gap-2">
                                <Label htmlFor="mega-auto-resize-height">height</Label>
                                <Input
                                    id="mega-auto-resize-height"
                                    type="number"
                                    value={visualConfig.resizeConfig.height.toString()}
                                    min={0}
                                    max={1000}
                                    step={10}
                                    onChange={(e) => {
                                        megaAutoStore.setVisualConig((cnf) => {
                                            cnf.resizeConfig.height = parseInt(e.target.value, 10);
                                        });
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
                <SheetFooter>
                    <Button onClick={submitChange}>{intl.get('function.confirm')}</Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
};

export default observer(PreferencePanel);
