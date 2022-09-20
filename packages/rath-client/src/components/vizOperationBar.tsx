import React, { useMemo } from 'react';
import { Dropdown, IDropdownOption, Position, SpinButton, Stack, Toggle } from '@fluentui/react';
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
    onValueChange: (key: 'debug' | 'interactive' | 'resizeMode' | 'width' | 'height' | 'nlg', value: any) => void;
}

const VizOperationBar: React.FC<VizOperationBarProps> = props => {
    const { gap = 10, width, height, interactive, debug, resizeMode, onValueChange, stackLayout } = props;
    const resizeModeList = useMemo<IDropdownOption[]>(() => {
        return [
            {
                text: intl.get('lts.operation.resizeMode.none'),
                key: IResizeMode.auto
            },
            {
                text: intl.get('lts.operation.resizeMode.resizable'),
                key: IResizeMode.control
            }
        ]
    }, [])

    return <Stack tokens={{ childrenGap: gap }} horizontal={stackLayout === 'horizontal'}>
        <Stack.Item>
            <Toggle label={intl.get('lts.operation.debug')}
                checked={debug}
                onChange={(e, checked) => {
                    onValueChange('debug', Boolean(checked))
                }}
            />
        </Stack.Item>
        <Stack.Item>
            <Toggle label={intl.get('lts.operation.zoom')}
                checked={interactive}
                onChange={(e, checked) => {
                    onValueChange('interactive', Boolean(checked))
                }}
            />
        </Stack.Item>
        <Stack.Item>
            <Toggle label="NLG"
                checked={interactive}
                onChange={(e, checked) => {
                    onValueChange('nlg', Boolean(checked))
                }}
            />
        </Stack.Item>
        <Stack.Item>
            <Dropdown selectedKey={resizeMode}
                style={{ width: '120px' }}
                label={intl.get('lts.operation.resize')}
                options={resizeModeList}
                onChange={(e, op) => {
                    op && onValueChange('resizeMode', op.key as IResizeMode)
                }}
            />
        </Stack.Item>
        {
            resizeMode === IResizeMode.control && <Stack.Item>
                <SpinButton label="width"
                    labelPosition={Position.top}
                    value={width.toString()}
                    style={{ width: '32px' }}
                    min={0}
                    max={1000}
                    step={10}
                    onValidate={v => {
                        onValueChange('width', parseInt(v));
                    }}
                    onIncrement={() => {
                        onValueChange('width', Math.min(width + 10, 1000))
                    }}
                    onDecrement={() => {
                        onValueChange('width', Math.max(width - 10, 10))
                    }}
                />
            </Stack.Item>
        }
        {
            resizeMode === IResizeMode.control && <Stack.Item>
                <SpinButton label="height"
                    labelPosition={Position.top}
                    value={height.toString()}
                    min={0}
                    max={1000}
                    step={10}
                    style={{ width: '32px' }}
                    onValidate={v => {
                        onValueChange('height', parseInt(v));
                    }}
                    onIncrement={() => {
                        onValueChange('height', Math.min(height + 10, 1000))
                    }}
                    onDecrement={() => {
                        onValueChange('height', Math.max(height - 10, 10))
                    }}
                />
            </Stack.Item>
        }
    </Stack>
}

export default VizOperationBar;
