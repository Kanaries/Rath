import React from 'react';
import { observer } from 'mobx-react-lite';
import { useGlobalStore } from '../../store';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../components/ui/sheet';
import Association from './association';

const AssoPanel: React.FC = () => {
    const { megaAutoStore } = useGlobalStore();
    return (
        <div>
            <Sheet
                open={megaAutoStore.showAsso}
                onOpenChange={(open) => {
                    if (!open) {
                        megaAutoStore.setShowAsso(false);
                    }
                }}
            >
                <SheetContent className="w-[592px] sm:max-w-none">
                    <SheetHeader className="sr-only">
                        <SheetTitle>Association</SheetTitle>
                    </SheetHeader>
                    <Association />
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default observer(AssoPanel);
