import React, { useCallback } from 'react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { toJS } from 'mobx';
import { RathIcon } from '../../../components/icons';
import { Button } from '../../../components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../components/ui/dropdown-menu';
import { useGlobalStore } from '../../../store';
import { IVisSpecType } from '../../../interfaces';
import type { IReactVegaHandler } from '../../../components/react-vega';
import { PIVOT_KEYS } from '../../../constants';

interface OperationBarProps {
    handler: React.RefObject<IReactVegaHandler>;
}
const OperationBar: React.FC<OperationBarProps> = ({ handler }) => {
    const { megaAutoStore, commonStore, collectionStore, painterStore, editorStore, semiAutoStore } = useGlobalStore();
    const { mainView } = megaAutoStore;

    const customizeAnalysis = useCallback(() => {
        if (mainView.spec) {
            commonStore.visualAnalysisInGraphicWalker(mainView.spec);
        }
    }, [mainView.spec, commonStore]);

    const analysisInPainter = useCallback(() => {
        if (mainView.spec && mainView.dataViewQuery) {
            painterStore.analysisInPainter(mainView.spec, mainView.dataViewQuery);
        }
    }, [mainView.spec, mainView.dataViewQuery, painterStore]);

    let isCollected = false;
    if (mainView.dataViewQuery && mainView.spec) {
        const viewFields = toJS(mainView.dataViewQuery.fields);
        const viewSpec = toJS(mainView.spec);
        isCollected = collectionStore.collectionContains(viewFields, viewSpec, IVisSpecType.vegaSubset);
    }

    return (
        <div style={{ position: 'relative', zIndex: 99 }}>
            <div className="flex items-center gap-1">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button type="button" variant="ghost" className="gap-1.5">
                            <RathIcon name="BarChartVerticalEdit" />
                            <span>{intl.get('megaAuto.commandBar.editing')}</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuItem onSelect={() => customizeAnalysis()}>
                            <RathIcon name="BarChartVerticalEdit" className="mr-2" />
                            {intl.get('megaAuto.commandBar.editInGW')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onSelect={() => {
                                if (mainView.dataViewQuery && mainView.spec) {
                                    editorStore.syncSpec(IVisSpecType.vegaSubset, mainView.spec);
                                    megaAutoStore.changeMainViewSpecSource();
                                }
                            }}
                        >
                            <RathIcon name="Edit" className="mr-2" />
                            {intl.get('megaAuto.commandBar.editInEditor')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <Button type="button" variant="ghost" className="gap-1.5" onClick={analysisInPainter}>
                    <RathIcon name="EditCreate" />
                    <span>{intl.get('megaAuto.commandBar.painting')}</span>
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    className="gap-1.5"
                    aria-pressed={isCollected}
                    onClick={() => {
                        if (mainView.dataViewQuery !== null) {
                            semiAutoStore.analysisInCopilot(toJS(mainView.dataViewQuery));
                            commonStore.setAppKey(PIVOT_KEYS.semiAuto);
                        }
                    }}
                >
                    <RathIcon name="Lightbulb" />
                    <span>{intl.get('megaAuto.commandBar.associate')}</span>
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    className="gap-1.5"
                    onClick={() => {
                        if (mainView.dataViewQuery && mainView.spec) {
                            collectionStore.toggleCollectState(toJS(mainView.dataViewQuery.fields), toJS(mainView.spec), IVisSpecType.vegaSubset);
                        }
                    }}
                >
                    <RathIcon name={isCollected ? 'FavoriteStarFill' : 'FavoriteStar'} />
                    <span>{intl.get('common.star')}</span>
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    disabled
                    className="gap-1.5"
                    onClick={() => {
                        megaAutoStore.setShowContraints(true);
                    }}
                >
                    <RathIcon name="MultiSelect" />
                    <span>{intl.get('megaAuto.commandBar.constraints')}</span>
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    className="gap-1.5"
                    onClick={() => {
                        handler.current?.exportImage();
                    }}
                >
                    <RathIcon name="Download" />
                    <span>{intl.get('megaAuto.commandBar.download')}</span>
                </Button>
            </div>
        </div>
    );
};

export default observer(OperationBar);
