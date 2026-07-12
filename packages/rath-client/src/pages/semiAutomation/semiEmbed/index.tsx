import { IPattern } from '@kanaries/loa';
import { runInAction } from 'mobx';
import React, { useEffect } from 'react';
import intl from 'react-intl-universal';
import { Button } from '../../../components/ui/button';
import { RathIcon } from '../../../components/icons';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../../components/ui/sheet';
import { useGlobalStore } from '../../../store';
import LiteFocusZone from './liteFocusZone';
import LitePredictZone from './litePredictZone';

interface IProps {
    show?: boolean;
    toggleShow?: (show: boolean) => void;
    view: IPattern | null;
    neighborKeys?: string[];
}
const SemiEmbed: React.FC<IProps> = (props) => {
    const { show, toggleShow, view, neighborKeys = [] } = props;
    const { semiAutoStore } = useGlobalStore();
    useEffect(() => {
        if (show && view && view.fields.length > 0) {
            runInAction(() => {
                semiAutoStore.clearMainView();
                semiAutoStore.updateMainView(view);
                semiAutoStore.setNeighborKeys(neighborKeys);
                // semiAutoStore.addMainViewField(focusVarId);
            });
        }
    }, [view, show, semiAutoStore, neighborKeys]);

    return (
        <div>
            <Button
                onClick={() => {
                    toggleShow && toggleShow(!show);
                }}
            >
                <RathIcon name="Lightbulb" />
                {intl.get('semiAuto.embed.insight_discovery')}
            </Button>
            <Sheet open={show} onOpenChange={(open) => !open && toggleShow && toggleShow(false)}>
                <SheetContent className="w-[592px] overflow-y-auto sm:max-w-none">
                    <SheetHeader>
                        <SheetTitle>{intl.get('semiAuto.embed.insights')}</SheetTitle>
                    </SheetHeader>
                    <LiteFocusZone />
                    <LitePredictZone />
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default SemiEmbed;
