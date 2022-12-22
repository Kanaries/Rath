import React, { useCallback, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import {
    PrimaryButton,
    IDropdownOption,
    IChoiceGroupOption,
} from '@fluentui/react';
import {
    ChatBubbleLeftEllipsisIcon,
    CubeIcon, CubeTransparentIcon, MagnifyingGlassCircleIcon, ViewfinderCircleIcon, WrenchIcon
} from '@heroicons/react/24/solid';
import intl from 'react-intl-universal';
import { runInAction } from 'mobx';
import { useGlobalStore } from '../../store';
import { EXPLORE_VIEW_ORDER } from '../../store/megaAutomation';
import { IResizeMode } from '../../interfaces';
import Toolbar from '../../components/toolbar';
import { ToolbarItemProps } from '../../components/toolbar/toolbar-item';


const PreferencePanel: React.FC = () => {
    const { megaAutoStore } = useGlobalStore();
    const { visualConfig, showPreferencePannel, nlgThreshold, vizMode } = megaAutoStore;

    const { nlg } = visualConfig;

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
        })
    }, [megaAutoStore])

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

    const items: ToolbarItemProps[] = [
        {
            key: 'viz_sys',
            icon: vizMode === 'lite' ? CubeTransparentIcon : CubeIcon,
            label: intl.get('semiAuto.main.vizsys.title'),
            menu: {
                items: [
                    {
                        key: 'lite',
                        icon: CubeTransparentIcon,
                        label: intl.get('semiAuto.main.vizsys.lite'),
                        checked: vizMode === 'lite',
                        onChange: checked => {
                            if (checked) {
                                megaAutoStore.setVizMode('lite');
                            }
                        },
                    },
                    {
                        key: 'strict',
                        icon: CubeIcon,
                        label: intl.get('semiAuto.main.vizsys.strict'),
                        checked: vizMode === 'strict',
                        onChange: checked => {
                            if (checked) {
                                megaAutoStore.setVizMode('strict');
                            }
                        },
                    },
                ],
            },
        },
        '-',
        {
            key: 'order',
            icon: CubeIcon,  // TODO:
            label: intl.get('megaAuto.orderBy.title'),
            menu: {
                items: [],  // TODO:
            },
        },
        {
            key: 'debug',
            icon: WrenchIcon,
            label: intl.get('megaAuto.operation.debug'),
            checked: visualConfig.debug,
            onChange: checked => {
                megaAutoStore.setVisualConig((cnf) => {
                    cnf.debug = checked;
                });
            },
        },
        {
            key: 'nlg',
            icon: ChatBubbleLeftEllipsisIcon,
            label: 'NLG(beta)',
            checked: nlg,
            onChange: checked => {
                megaAutoStore.setVisualConig((cnf) => {
                    cnf.nlg = checked;
                });
            },
        },
    ];

    return (
        <Toolbar
            items={items}
            styles={{
                root: { padding: '1.2em 0 0.4em' }
            }}
        />
    );

    // return (
    //     <Panel
    //         isOpen={showPreferencePannel}
    //         type={PanelType.smallFixedFar}
    //         onDismiss={closeVisualPannel}
    //         headerText={intl.get('preference.config')}
    //         closeButtonAriaLabel="Close"
    //         onRenderFooterContent={onRenderFooterContent}
    //     >
    //         <Stack.Item>
    //             <Dropdown
    //                 style={{ minWidth: '120px' }}
    //                 selectedKey={megaAutoStore.orderBy}
    //                 options={orderOptions}
    //                 label={intl.get('megaAuto.orderBy.title')}
    //                 onChange={(e, item) => {
    //                     item && megaAutoStore.setExploreOrder(item.key as string);
    //                 }}
    //             />
    //         </Stack.Item>
    //         <Stack tokens={{ childrenGap: 10 }}>
    //             <Stack.Item>
    //                 <Slider
    //                     disabled={!nlg}
    //                     value={nlgThreshold}
    //                     label="NLG Threshold(beta)"
    //                     min={0}
    //                     max={1}
    //                     step={0.01}
    //                     valueFormat={(value: number) => `${Math.round(value * 100)}%`}
    //                     showValue={true}
    //                     onChange={(value: number) => {
    //                         megaAutoStore.setNlgThreshold(value);
    //                     }}
    //                 />
    //             </Stack.Item>
    //             <Stack.Item>
    //                 <Dropdown
    //                     selectedKey={visualConfig.resize}
    //                     label={intl.get('megaAuto.operation.resize')}
    //                     options={resizeModeList}
    //                     onChange={(e, op) => {
    //                         op &&
    //                             megaAutoStore.setVisualConig((cnf) => {
    //                                 cnf.resize = op.key as any;
    //                             });
    //                     }}
    //                 />
    //             </Stack.Item>
    //             {visualConfig.resize === IResizeMode.control && (
    //                 <Stack.Item>
    //                     <SpinButton
    //                         label="width"
    //                         labelPosition={Position.top}
    //                         value={visualConfig.resizeConfig.width.toString()}
    //                         style={{ width: '32px' }}
    //                         min={0}
    //                         max={1000}
    //                         step={10}
    //                         onValidate={(v) => {
    //                             megaAutoStore.setVisualConig((cnf) => {
    //                                 cnf.resizeConfig.width = parseInt(v);
    //                             });
    //                         }}
    //                         onIncrement={() => {
    //                             megaAutoStore.setVisualConig((cnf) => {
    //                                 cnf.resizeConfig.width = Math.min(cnf.resizeConfig.width + 10, 1000);
    //                             });
    //                         }}
    //                         onDecrement={() => {
    //                             megaAutoStore.setVisualConig((cnf) => {
    //                                 cnf.resizeConfig.width = Math.max(cnf.resizeConfig.width - 10, 10);
    //                             });
    //                         }}
    //                     />
    //                 </Stack.Item>
    //             )}
    //             {visualConfig.resize === IResizeMode.control && (
    //                 <Stack.Item>
    //                     <SpinButton
    //                         label="height"
    //                         labelPosition={Position.top}
    //                         value={visualConfig.resizeConfig.height.toString()}
    //                         min={0}
    //                         max={1000}
    //                         step={10}
    //                         style={{ width: '32px' }}
    //                         onValidate={(v) => {
    //                             megaAutoStore.setVisualConig((cnf) => {
    //                                 cnf.resizeConfig.height = parseInt(v);
    //                             });
    //                         }}
    //                         onIncrement={() => {
    //                             megaAutoStore.setVisualConig((cnf) => {
    //                                 cnf.resizeConfig.height = Math.min(cnf.resizeConfig.height + 10, 1000);
    //                             });
    //                         }}
    //                         onDecrement={() => {
    //                             megaAutoStore.setVisualConig((cnf) => {
    //                                 cnf.resizeConfig.height = Math.max(cnf.resizeConfig.height - 10, 10);
    //                             });
    //                         }}
    //                     />
    //                 </Stack.Item>
    //             )}
    //         </Stack>
    //     </Panel>
    // );
};

export default observer(PreferencePanel);
