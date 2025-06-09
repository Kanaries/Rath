import { IContextualMenuItem, IContextualMenuProps } from '@fluentui/react';
import { observer, useObserver } from 'mobx-react-lite';
import React, { useCallback, useMemo } from 'react';
import intl from 'react-intl-universal';
import { Menu, MenuButtonProps, MenuItem, MenuList, MenuPopover, MenuTrigger, SplitButton } from '@fluentui/react-components';
import { BarChart3 } from 'lucide-react';
import va from '@vercel/analytics';
import { toJS } from 'mobx';
import { EXPLORE_MODE, PIVOT_KEYS } from '../../../constants';
import { useGlobalStore } from '../../../store';

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

    const analysisOptions: IContextualMenuProps = useMemo(() => {
        return {
            items: [
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
            ],
        };
    }, [startMegaAutoAnalysis, onCheckResults, startSemiAutoAnalysis, commonStore]);
    const startMode = useMemo<IContextualMenuItem>(() => {
        if (exploreMode === EXPLORE_MODE.first || fieldMetas.length > 25) {
            return analysisOptions.items[2];
        }
        if (exploreMode === EXPLORE_MODE.manual) {
            return analysisOptions.items[3];
        }
        if (hasResults) {
            return analysisOptions.items[1];
        }
        return analysisOptions.items[0];
    }, [hasResults, exploreMode, analysisOptions, fieldMetas]);

    return useObserver(() => ({
        startMode,
        analysisOptions,
        satisfyAnalysisCondition,
    }));
};

const MainActionButton: React.FC = () => {
    const { satisfyAnalysisCondition, startMode, analysisOptions } = useActionModes();
    const { userStore } = useGlobalStore();

    const startHandler = useCallback(() => {
        startMode.onClick && startMode.onClick();
        va.track('start_analysis', { userName: userStore.userName, mode: startMode.key });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startMode]);

    return (
        <Menu positioning="below-end">
            <MenuTrigger disableButtonEnhancement>
                {(triggerProps: MenuButtonProps) => (
                    <SplitButton
                        disabled={!satisfyAnalysisCondition}
                        primaryActionButton={{ onClick: startHandler }}
                        menuButton={triggerProps}
                        appearance="primary"
                        icon={<BarChart3 />}
                    >
                        {intl.get(`${startMode.key}`)}
                    </SplitButton>
                )}
            </MenuTrigger>

            <MenuPopover>
                <MenuList>
                    {analysisOptions.items.map((item) => {
                        return (
                            <MenuItem key={item.key} onClick={item.onClick}>
                                {item.text}
                            </MenuItem>
                        );
                    })}
                </MenuList>
            </MenuPopover>
        </Menu>
    );
};

export default observer(MainActionButton);
