import { observer } from 'mobx-react-lite';
import React, { useCallback, useMemo } from 'react';
import intl from 'react-intl-universal';
import va from '@vercel/analytics';
import { toJS } from 'mobx';
import { RathIcon } from '../../../components/icons';
import { Button } from '../../../components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../components/ui/dropdown-menu';
import { EXPLORE_MODE, PIVOT_KEYS } from '../../../constants';
import { useGlobalStore } from '../../../store';

interface AnalysisOption {
    key: string;
    text: string;
    onClick: () => void;
}

export const useActionModes = function () {
    const { dataSourceStore, commonStore, ltsPipeLineStore, megaAutoStore } = useGlobalStore();
    const { exploreMode, taskMode } = commonStore;
    const { satisfyAnalysisCondition, fieldMetas } = dataSourceStore;
    const startMegaAutoAnalysis = useCallback(() => {
        ltsPipeLineStore.startTask(taskMode, toJS(megaAutoStore.visualConfig.viewSizeLimit)).then(() => {
            megaAutoStore.emitViewChangeTransaction(0);
        });
        commonStore.setAppKey(PIVOT_KEYS.megaAuto);
    }, [ltsPipeLineStore, megaAutoStore, commonStore, taskMode]);

    const onCheckResults = useCallback(() => {
        megaAutoStore.emitViewChangeTransaction(0);
        commonStore.setAppKey(PIVOT_KEYS.megaAuto);
    }, [megaAutoStore, commonStore]);

    const startSemiAutoAnalysis = useCallback(() => {
        commonStore.setAppKey(PIVOT_KEYS.semiAuto);
    }, [commonStore]);
    const hasResults = megaAutoStore.insightSpaces.length > 0;

    const analysisOptions = useMemo<AnalysisOption[]>(() => {
        return [
            {
                key: 'function.analysis.start',
                text: intl.get('function.analysis.start'),
                onClick: startMegaAutoAnalysis,
            },
            {
                key: 'function.analysis.checkResult',
                text: intl.get('function.analysis.checkResult'),
                onClick: onCheckResults,
            },
            {
                key: 'function.analysis.pattern',
                text: intl.get('function.analysis.pattern'),
                onClick: startSemiAutoAnalysis,
            },
            {
                key: 'function.analysis.manual',
                text: intl.get('function.analysis.manual'),
                onClick: () => {
                    commonStore.setAppKey(PIVOT_KEYS.editor);
                },
            },
            {
                key: 'function.analysis.causal',
                text: intl.get('function.analysis.causal'),
                onClick: () => {
                    commonStore.setAppKey(PIVOT_KEYS.causal);
                },
            },
        ];
    }, [startMegaAutoAnalysis, onCheckResults, startSemiAutoAnalysis, commonStore]);
    const startMode = useMemo<AnalysisOption>(() => {
        if (exploreMode === EXPLORE_MODE.first || fieldMetas.length > 25) {
            return analysisOptions[2];
        }
        if (exploreMode === EXPLORE_MODE.manual) {
            return analysisOptions[3];
        }
        if (hasResults) {
            return analysisOptions[1];
        }
        return analysisOptions[0];
    }, [hasResults, exploreMode, analysisOptions, fieldMetas]);

    return {
        startMode,
        analysisOptions,
        satisfyAnalysisCondition,
    };
};

const MainActionButton: React.FC = () => {
    const { satisfyAnalysisCondition, startMode, analysisOptions } = useActionModes();

    const startHandler = useCallback(() => {
        startMode.onClick();
        va.track('start_analysis', { mode: startMode.key });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startMode]);

    return (
        <div className="inline-flex">
            <Button type="button" disabled={!satisfyAnalysisCondition} onClick={startHandler} className="gap-1.5 rounded-r-none">
                <RathIcon name="AnalyticsView" />
                <span>{intl.get(`${startMode.key}`)}</span>
            </Button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        type="button"
                        size="icon"
                        disabled={!satisfyAnalysisCondition}
                        aria-label="Choose analysis mode"
                        title="Choose analysis mode"
                        className="rounded-l-none border-l border-primary-foreground/25 px-0"
                    >
                        <RathIcon name="CaretSolidDown" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {analysisOptions.map((item) => (
                        <DropdownMenuItem key={item.key} onSelect={item.onClick}>
                            {item.text}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};

export default observer(MainActionButton);
