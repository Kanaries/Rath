import React, { useMemo } from 'react';
import { Dropdown, IDropdownOption, Position, SpinButton, Stack } from '@fluentui/react';
import { Switch } from '@fluentui/react-components';
import intl from 'react-intl-universal';
import { IResizeMode } from '../interfaces';

interface VizOperationBarProps {
    gap?: number;
    stackLayout: 'horizontal' | 'vertical';
    debug: boolean;
    interactive: boolean;
    resizeMode: IResizeMode;
    width: number;
    height: number;
    nlg: boolean;
    excludeScaleZero: boolean;
    onValueChange: (key: 'debug' | 'interactive' | 'resizeMode' | 'width' | 'height' | 'nlg' | 'excludeScaleZero', value: any) => void;
}

const VizOperationBar: React.FC<VizOperationBarProps> = props => {
    const { gap = 10, width, height, interactive, debug, resizeMode, onValueChange, stackLayout, nlg, excludeScaleZero } = props;
    const resizeModeList = useMemo<IDropdownOption[]>(() => {
        return [
            {
                text: intl.get('megaAuto.operation.resizeMode.none'),
                key: IResizeMode.auto
            },
            {
                text: intl.get('megaAuto.operation.resizeMode.resizable'),
                key: IResizeMode.control
            }
        ]
    }, [])

    return <Stack tokens={{ childrenGap: gap }} horizontal={stackLayout === 'horizontal'}>
        <Stack.Item>
            <Switch 
                label={intl.get('megaAuto.operation.excludeScaleZero')}
                checked={excludeScaleZero}
                onChange={(e, data) => {
                    onValueChange('excludeScaleZero', Boolean(data.checked))
                }}
            />
        </Stack.Item>
        <Stack.Item>
            <Switch 
                label={intl.get('megaAuto.operation.debug')}
                checked={debug}
                onChange={(e, data) => {
                    onValueChange('debug', Boolean(data.checked))
                }}
            />
        </Stack.Item>
        <Stack.Item>
            <Switch 
                label={intl.get('megaAuto.operation.zoom')}
                checked={interactive}
                onChange={(e, data) => {
                    onValueChange('interactive', Boolean(data.checked))
                }}
            />
        </Stack.Item>
        <Stack.Item>
            <Switch 
                label="NLG"
                checked={nlg}
                onChange={(e, data) => {
                    onValueChange('nlg', Boolean(data.checked))
                }}
            />
        </Stack.Item>
        <Stack.Item>
            <Dropdown
                selectedKey={resizeMode}
                onChange={(e, option) => {
                    option && onValueChange('resizeMode', option.key);
                }}
                options={resizeModeList}
            />
        </Stack.Item>
        {
            resizeMode === IResizeMode.control && <Stack.Item>
                <SpinButton
                    label={intl.get('megaAuto.operation.width')}
                    labelPosition={Position.top}
                    value={width.toString()}
                    onValidate={(v) => {
                        onValueChange('width', Number(v))
                    }}
                    onIncrement={(v) => {
                        onValueChange('width', Number(v) + 20);
                    }}
                    onDecrement={(v) => {
                        onValueChange('width', Math.max(Number(v) - 20, 0));
                    }}
                />
            </Stack.Item>
        }
        {
            resizeMode === IResizeMode.control && <Stack.Item>
                <SpinButton
                    label={intl.get('megaAuto.operation.height')}
                    labelPosition={Position.top}
                    value={height.toString()}
                    onValidate={(v) => {
                        onValueChange('height', Number(v))
                    }}
                    onIncrement={(v) => {
                        onValueChange('height', Number(v) + 20);
                    }}
                    onDecrement={(v) => {
                        onValueChange('height', Math.max(Number(v) - 20, 0));
                    }}
                />
            </Stack.Item>
        }
    </Stack>
}

export default VizOperationBar;
