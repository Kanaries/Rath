import React, { useCallback, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import {
    PrimaryButton,
    Stack,
    Panel,
    PanelType,
    Slider,
    Dropdown,
    IDropdownOption,
    Toggle,
    SpinButton,
    Position,
    ChoiceGroup,
    IChoiceGroupOption,
} from '@fluentui/react';
import intl from 'react-intl-universal';
import { runInAction } from 'mobx';
import { Label } from '@fluentui/react-components';
import { useGlobalStore } from '../../store';
import { EXPLORE_VIEW_ORDER } from '../../store/megaAutomation';
import { IResizeMode } from '../../interfaces';

const PreferencePanel: React.FC = () => {
    const { megaAutoStore } = useGlobalStore();
    const { visualConfig, showPreferencePannel, nlgThreshold, vizMode } = megaAutoStore;

    const { nlg, viewSizeLimit } = visualConfig;

    const orderOptions: IDropdownOption[] = Object.values(EXPLORE_VIEW_ORDER).map((or) => ({
        text: intl.get(`megaAuto.orderBy.${or}`),
        key: or,
    }));

    const resizeModeList = useMemo<IDropdownOption[]>(() => {
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

    const onRenderFooterContent = () => (
        <div>
            <PrimaryButton onClick={submitChange}>{intl.get('function.confirm')}</PrimaryButton>
        </div>
    );

    const vizModeOptions = useMemo<IChoiceGroupOption[]>(() => {
        return [
            { text: intl.get('semiAuto.main.vizsys.lite'), key: 'lite' },
            { text: intl.get('semiAuto.main.vizsys.strict'), key: 'strict' },
        ];
    }, []);

    return (
        <Panel
            isOpen={showPreferencePannel}
            type={PanelType.smallFixedFar}
            onDismiss={closeVisualPannel}
            headerText={intl.get('preference.config')}
            closeButtonAriaLabel="Close"
            onRenderFooterContent={onRenderFooterContent}
        >
            <Stack.Item>
                <Label>Default SpinButton</Label>
                <SpinButton
                    value={viewSizeLimit.measure.toString()}
                    min={1}
                    max={20}
                    step={1}
                    onChange={(e, v) => {
                        megaAutoStore.setVisualConig((cnf) => {
                            cnf.viewSizeLimit.measure = Number(v);
                        });
                    }}
                />
            </Stack.Item>
            <Stack.Item>
                <ChoiceGroup
                    label={intl.get('semiAuto.main.vizsys.title')}
                    onChange={(e, op) => {
                        op && megaAutoStore.setVizMode(op.key as 'lite' | 'strict');
                    }}
                    selectedKey={vizMode}
                    options={vizModeOptions}
                />
            </Stack.Item>
            <Stack.Item>
                <Dropdown
                    style={{ minWidth: '120px' }}
                    selectedKey={megaAutoStore.orderBy}
                    options={orderOptions}
                    label={intl.get('megaAuto.orderBy.title')}
                    onChange={(e, item) => {
                        item && megaAutoStore.setExploreOrder(item.key as string);
                    }}
                />
            </Stack.Item>
            <Stack tokens={{ childrenGap: 10 }}>
                <Stack.Item>
                    <Toggle
                        label={intl.get('megaAuto.operation.excludeScaleZero')}
                        checked={visualConfig.excludeScaleZero}
                        onChange={(e, checked) => {
                            megaAutoStore.setVisualConig((cnf) => {
                                cnf.excludeScaleZero = Boolean(checked);
                            });
                        }}
                    />
                </Stack.Item>
                <Stack.Item>
                    <Toggle
                        label={intl.get('megaAuto.operation.debug')}
                        checked={visualConfig.debug}
                        onChange={(e, checked) => {
                            megaAutoStore.setVisualConig((cnf) => {
                                cnf.debug = Boolean(checked);
                            });
                        }}
                    />
                </Stack.Item>
                <Stack.Item>
                    <Toggle
                        label={intl.get('megaAuto.operation.zoom')}
                        checked={visualConfig.zoom}
                        onChange={(e, checked) => {
                            megaAutoStore.setVisualConig((cnf) => {
                                cnf.zoom = Boolean(checked);
                            });
                        }}
                    />
                </Stack.Item>
                <Stack.Item>
                    <Toggle
                        label="NLG(beta)"
                        checked={visualConfig.nlg}
                        onChange={(e, checked) => {
                            megaAutoStore.setVisualConig((cnf) => {
                                cnf.nlg = Boolean(checked);
                            });
                        }}
                    />
                </Stack.Item>
                <Stack.Item>
                    <Slider
                        disabled={!nlg}
                        value={nlgThreshold}
                        label="NLG Threshold(beta)"
                        min={0}
                        max={1}
                        step={0.01}
                        valueFormat={(value: number) => `${Math.round(value * 100)}%`}
                        showValue={true}
                        onChange={(value: number) => {
                            megaAutoStore.setNlgThreshold(value);
                        }}
                    />
                </Stack.Item>
                <Stack.Item>
                    <Dropdown
                        selectedKey={visualConfig.resize}
                        label={intl.get('megaAuto.operation.resize')}
                        options={resizeModeList}
                        onChange={(e, op) => {
                            op &&
                                megaAutoStore.setVisualConig((cnf) => {
                                    cnf.resize = op.key as any;
                                });
                        }}
                    />
                </Stack.Item>
                {visualConfig.resize === IResizeMode.control && (
                    <Stack.Item>
                        <SpinButton
                            label="width"
                            labelPosition={Position.top}
                            value={visualConfig.resizeConfig.width.toString()}
                            style={{ width: '32px' }}
                            min={0}
                            max={1000}
                            step={10}
                            onValidate={(v) => {
                                megaAutoStore.setVisualConig((cnf) => {
                                    cnf.resizeConfig.width = parseInt(v);
                                });
                            }}
                            onIncrement={() => {
                                megaAutoStore.setVisualConig((cnf) => {
                                    cnf.resizeConfig.width = Math.min(cnf.resizeConfig.width + 10, 1000);
                                });
                            }}
                            onDecrement={() => {
                                megaAutoStore.setVisualConig((cnf) => {
                                    cnf.resizeConfig.width = Math.max(cnf.resizeConfig.width - 10, 10);
                                });
                            }}
                        />
                    </Stack.Item>
                )}
                {visualConfig.resize === IResizeMode.control && (
                    <Stack.Item>
                        <SpinButton
                            label="height"
                            labelPosition={Position.top}
                            value={visualConfig.resizeConfig.height.toString()}
                            min={0}
                            max={1000}
                            step={10}
                            style={{ width: '32px' }}
                            onValidate={(v) => {
                                megaAutoStore.setVisualConig((cnf) => {
                                    cnf.resizeConfig.height = parseInt(v);
                                });
                            }}
                            onIncrement={() => {
                                megaAutoStore.setVisualConig((cnf) => {
                                    cnf.resizeConfig.height = Math.min(cnf.resizeConfig.height + 10, 1000);
                                });
                            }}
                            onDecrement={() => {
                                megaAutoStore.setVisualConig((cnf) => {
                                    cnf.resizeConfig.height = Math.max(cnf.resizeConfig.height - 10, 10);
                                });
                            }}
                        />
                    </Stack.Item>
                )}
            </Stack>
        </Panel>
    );
};

export default observer(PreferencePanel);
