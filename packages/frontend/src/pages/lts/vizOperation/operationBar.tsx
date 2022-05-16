import { observer } from 'mobx-react-lite';
import { Stack, CommandBarButton, IContextualMenuProps, Toggle, Dropdown, IDropdownOption, SpinButton, Position } from 'office-ui-fabric-react';
import React, { useCallback, useMemo } from 'react';
import { PIVOT_KEYS } from '../../../constants';
import { useGlobalStore } from '../../../store';
import intl from 'react-intl-universal';

interface OperationBarProps {}
const OperationBar: React.FC<OperationBarProps> = props => {
    const { exploreStore, commonStore, dataSourceStore } = useGlobalStore();
    const { taskMode } = commonStore;
    const { dimFields, meaFields } = dataSourceStore;
    const { visualConfig } = exploreStore;

    const resizeModeList = useMemo<IDropdownOption[]>(() => {
        return [
            {
                text: intl.get('lts.operation.resizeMode.none'),
                key: 'none'
            },
            {
                text: intl.get('lts.operation.resizeMode.resizable'),
                key: 'resizable'
            }
        ]
    }, [])

    const dimensionOptions: IContextualMenuProps = {
        items: dimFields.map(f => ({
            key: f.fid,
            text: f.name,
            onClick: () => { exploreStore.addFieldToForkView('dimensions', f.fid) }
        }))
    }
    const measureOptions: IContextualMenuProps = {
        items: meaFields.map(f => ({
            key: f.fid,
            text: f.name,
            onClick: () => { exploreStore.addFieldToForkView('measures', f.fid) }
        }))
    }

    const customizeAnalysis = useCallback(() => {
        exploreStore.bringToGrphicWalker();
        commonStore.setAppKey(PIVOT_KEYS.editor)
    }, [exploreStore, commonStore])

    return <div style={{ position: 'relative'}}>
        <Stack horizontal>
            <Stack.Item align="start">
                <CommandBarButton menuProps={dimensionOptions} text={intl.get('common.dimension')} iconProps={{ iconName: 'AddTo' }} />
            </Stack.Item>
            <Stack.Item align="start">
                <CommandBarButton menuProps={measureOptions} text={intl.get('common.measure')} iconProps={{ iconName: 'AddTo' }} />
            </Stack.Item>
            <Stack.Item align="start">
                <CommandBarButton text={intl.get('lts.commandBar.editing')} iconProps={{ iconName: 'BarChartVerticalEdit' }} onClick={customizeAnalysis} />
            </Stack.Item>
            <Stack.Item align="start">
                <CommandBarButton text={intl.get('lts.commandBar.associate')} iconProps={{ iconName: 'Lightbulb' }} onClick={() => {
                    exploreStore.getAssociatedViews(taskMode);
                }} />
            </Stack.Item>
            <Stack.Item align="start">
                <CommandBarButton text={intl.get('lts.commandBar.constraints')} iconProps={{ iconName: 'MultiSelect' }} onClick={() => {
                    exploreStore.setShowContraints(true);
                }} />
            </Stack.Item>
        </Stack>
        <Stack tokens={{ childrenGap: 10 }} style={{ position: 'absolute', right: 0, top: 0, minWidth: '100px', padding: '1em', backgroundColor: '#fff', border: '1px solid #f5f5f5' }}>
            <Stack.Item>
                <Toggle label={intl.get('lts.operation.debug')} checked={visualConfig.debug} onChange={(e, checked) => {
                    exploreStore.setVisualConig((cnf => {
                        cnf.debug = Boolean(checked)
                    }))
                }} />
            </Stack.Item>
            <Stack.Item>
                <Toggle label={intl.get('lts.operation.zoom')} checked={visualConfig.zoom} onChange={(e, checked) => {
                    exploreStore.setVisualConig((cnf => {
                        cnf.zoom = Boolean(checked)
                    }))
                }} />
            </Stack.Item>
            <Stack.Item>
                <Dropdown selectedKey={visualConfig.resize}
                    label={intl.get('lts.operation.resize')}
                    options={resizeModeList}
                    onChange={(e, op) => {
                        op && exploreStore.setVisualConig(cnf => {
                            cnf.resize = op.key as any
                        })
                    }}
                />
            </Stack.Item>
            {
                visualConfig.resize === 'resizable' && <Stack.Item>
                    <SpinButton label="width"
                        labelPosition={Position.top}
                        value={visualConfig.resizeConfig.width.toString()}
                        style={{ width: '32px' }}
                        min={0}
                        max={1000}
                        step={10}
                        onValidate={v => {
                            exploreStore.setVisualConig(cnf => {
                                cnf.resizeConfig.width = parseInt(v);
                            })
                        }}
                        onIncrement={() => {
                            exploreStore.setVisualConig(cnf => {
                                cnf.resizeConfig.width = Math.min(cnf.resizeConfig.width + 10, 1000);
                            })
                        }}
                        onDecrement={() => {
                            exploreStore.setVisualConig(cnf => {
                                cnf.resizeConfig.width = Math.max(cnf.resizeConfig.width - 10, 10);
                            })
                        }}
                    />
                </Stack.Item>
            }
            {
                visualConfig.resize === 'resizable' && <Stack.Item>
                    <SpinButton label="height"
                        labelPosition={Position.top}
                        value={visualConfig.resizeConfig.height.toString()}
                        min={0}
                        max={1000}
                        step={10}
                        style={{ width: '32px' }}
                        onValidate={v => {
                            exploreStore.setVisualConig(cnf => {
                                cnf.resizeConfig.height = parseInt(v);
                            })
                        }}
                        onIncrement={() => {
                            exploreStore.setVisualConig(cnf => {
                                cnf.resizeConfig.height = Math.min(cnf.resizeConfig.height + 10, 1000);
                            })
                        }}
                        onDecrement={() => {
                            exploreStore.setVisualConig(cnf => {
                                cnf.resizeConfig.height = Math.max(cnf.resizeConfig.height - 10, 10);
                            })
                        }}
                    />
                </Stack.Item>
            }
        </Stack>
    </div>
}

export default observer(OperationBar);
