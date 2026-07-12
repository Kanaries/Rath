import React, { useCallback, useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import intl from 'react-intl-universal';
import { useGlobalStore } from '../../../store';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Label } from '../../../components/ui/label';
import { Slider } from '../../../components/ui/slider';
import { Switch } from '../../../components/ui/switch';

const FastSelection: React.FC = () => {
    const { dataSourceStore } = useGlobalStore();
    const { meaFields } = dataSourceStore;
    const [syncMode, setSyncMode] = useState<boolean>(true);
    const [ranges, setRanges] = useState<[number, number][]>(meaFields.map((mea) => [0.05, 0.95]));

    useEffect(() => {
        setRanges(meaFields.map(() => [0.05, 0.95]));
    }, [meaFields]);

    const handleRangeChange = useCallback(
        (meaIndex: number, range: [number, number]) => {
            if (syncMode) {
                setRanges((rs) => rs.map((r) => [...range]));
            } else {
                setRanges((rs) => {
                    const nextRs = [...rs];
                    nextRs[meaIndex] = [...range];
                    return nextRs;
                });
            }
        },
        [syncMode]
    );

    return (
        <div>
            <Dialog
                open={dataSourceStore.showFastSelectionModal}
                onOpenChange={(open) => {
                    dataSourceStore.setShowFastSelection(open);
                }}
            >
                <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{intl.get('dataSource.selection.title')}</DialogTitle>
                        <DialogDescription>{intl.get('dataSource.selection.desc')}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3">
                        <div className="mb-1 flex items-center gap-2">
                            <Switch
                                id="fast-selection-sync-mode"
                                checked={syncMode}
                                onCheckedChange={(checked) => {
                                    setSyncMode(checked);
                                }}
                            />
                            <Label htmlFor="fast-selection-sync-mode">{intl.get('dataSource.selection.syncMode')}</Label>
                        </div>
                        {meaFields.length === ranges.length &&
                            meaFields.map((mea, meaIndex) => {
                                const sliderId = `fast-selection-${mea.fid}`;
                                const minimum = `${Math.round(ranges[meaIndex][0] * 100)}%`;
                                const maximum = `${Math.round(ranges[meaIndex][1] * 100)}%`;
                                return (
                                    <div key={mea.fid} className="grid gap-1.5">
                                        <Label htmlFor={sliderId}>{mea.name}</Label>
                                        <div className="flex items-center gap-3">
                                            <output className="w-10 shrink-0 text-right text-sm tabular-nums text-muted-foreground">{minimum}</output>
                                            <Slider
                                                id={sliderId}
                                                className="min-w-0 flex-1"
                                                min={0}
                                                value={ranges[meaIndex]}
                                                thumbLabels={[`${mea.name} minimum`, `${mea.name} maximum`]}
                                                step={0.01}
                                                max={1}
                                                onValueChange={(value) => {
                                                    handleRangeChange(meaIndex, [value[0], value[1]]);
                                                }}
                                            />
                                            <output className="w-10 shrink-0 text-sm tabular-nums text-muted-foreground">{maximum}</output>
                                        </div>
                                    </div>
                                );
                            })}
                        <DialogFooter className="mt-1">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    dataSourceStore.setShowFastSelection(false);
                                }}
                            >
                                {intl.get('function.cancel')}
                            </Button>
                            <Button
                                type="button"
                                onClick={() => {
                                    dataSourceStore.createBatchFilterByQts(
                                        meaFields.map((m) => m.fid),
                                        ranges
                                    );
                                    dataSourceStore.setShowFastSelection(false);
                                }}
                            >
                                {intl.get('function.confirm')}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default observer(FastSelection);
