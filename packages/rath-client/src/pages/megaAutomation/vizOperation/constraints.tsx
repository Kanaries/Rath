import React, { useCallback, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import intl from 'react-intl-universal';
import { Checkbox } from '../../../components/ui/checkbox';
import { Label } from '../../../components/ui/label';
import { Separator } from '../../../components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../../components/ui/sheet';
import { useGlobalStore } from '../../../store';

interface ConstraintsPanelProps {}
const CHECKBOX_EXAMPLES = [
    { fid: 'exclude', state: -1 },
    { fid: 'auto', state: 0 },
    { fid: 'include', state: 1 },
];
const ConstraintsPanel: React.FC<ConstraintsPanelProps> = (props) => {
    const { megaAutoStore } = useGlobalStore();
    const { showConstraints, globalConstraints } = megaAutoStore;
    const { dimensions, measures } = globalConstraints;
    const closePanel = useCallback(() => {
        megaAutoStore.setShowContraints(false);
    }, [megaAutoStore]);
    useEffect(() => {
        megaAutoStore.initConstraints();
    }, [megaAutoStore, showConstraints]);
    return (
        <Sheet open={showConstraints} onOpenChange={(open) => !open && closePanel()}>
            <SheetContent className="w-[480px] overflow-y-auto sm:max-w-none">
                <SheetHeader>
                    <SheetTitle>{intl.get('megaAuto.commandBar.constraints')}</SheetTitle>
                </SheetHeader>
                <div className="grid gap-3">
                    <div className="space-y-2">
                        <div className="text-sm font-medium">Explain</div>
                        <Separator />
                    </div>
                    {CHECKBOX_EXAMPLES.map((f) => (
                        <div key={f.fid} className="flex items-center gap-2">
                            <Checkbox disabled checked={f.state === 0 ? 'indeterminate' : f.state === 1} />
                            <Label>{intl.get(`megaAuto.constraints.${f.fid}`)}</Label>
                        </div>
                    ))}
                    <div className="space-y-2">
                        <div className="text-sm font-medium">{intl.get('common.dimension')}</div>
                        <Separator />
                    </div>
                    {dimensions.map((f, fIndex) => (
                        <div key={f.fid} className="flex items-center gap-2">
                            <Checkbox
                                checked={f.state === 0 ? 'indeterminate' : f.state === 1}
                                onCheckedChange={() => {
                                    megaAutoStore.updateConstraints('dimensions', fIndex);
                                }}
                            />
                            <Label>{f.name || f.fid}</Label>
                        </div>
                    ))}
                    <div className="space-y-2">
                        <div className="text-sm font-medium">{intl.get('common.measure')}</div>
                        <Separator />
                    </div>
                    {measures.map((f, fIndex) => (
                        <div key={f.fid} className="flex items-center gap-2">
                            <Checkbox
                                checked={f.state === 0 ? 'indeterminate' : f.state === 1}
                                onCheckedChange={() => {
                                    megaAutoStore.updateConstraints('dimensions', fIndex);
                                }}
                            />
                            <Label>{f.name || f.fid}</Label>
                        </div>
                    ))}
                </div>
            </SheetContent>
        </Sheet>
    );
};

export default observer(ConstraintsPanel);
