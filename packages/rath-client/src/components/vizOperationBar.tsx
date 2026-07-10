import React, { useMemo } from 'react';
import intl from 'react-intl-universal';
import { IResizeMode } from '../interfaces';
import { RathSelect, RathSelectOption } from './rath-ui/rath-select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';

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

const VizOperationBar: React.FC<VizOperationBarProps> = (props) => {
    const { gap = 10, width, height, interactive, debug, resizeMode, onValueChange, stackLayout, nlg, excludeScaleZero } = props;
    const resizeModeList = useMemo<RathSelectOption[]>(() => {
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

    const containerClassName = stackLayout === 'horizontal' ? 'flex flex-row flex-wrap items-end' : 'flex flex-col';
    const gapStyle = { gap };

    const renderToggle = (label: string, checked: boolean, key: Parameters<typeof onValueChange>[0]) => (
        <div className="flex items-center gap-2">
            <Switch
                checked={checked}
                onCheckedChange={(value) => {
                    onValueChange(key, value);
                }}
            />
            <Label>{label}</Label>
        </div>
    );

    const renderNumberInput = (label: string, value: number, key: 'width' | 'height') => (
        <div className="flex flex-col gap-1">
            <Label>{label}</Label>
            <Input
                className="w-24"
                type="number"
                value={value}
                min={0}
                max={1000}
                step={10}
                onChange={(event) => {
                    const next = Number.parseInt(event.target.value, 10);
                    onValueChange(key, Number.isNaN(next) ? 0 : next);
                }}
            />
        </div>
    );

    return (
        <div className={containerClassName} style={gapStyle}>
            <div>{renderToggle(intl.get('megaAuto.operation.excludeScaleZero'), excludeScaleZero, 'excludeScaleZero')}</div>
            <div>{renderToggle(intl.get('megaAuto.operation.debug'), debug, 'debug')}</div>
            <div>{renderToggle(intl.get('megaAuto.operation.zoom'), interactive, 'interactive')}</div>
            <div>{renderToggle('NLG', nlg, 'nlg')}</div>
            <div>
                <RathSelect
                    selectedKey={resizeMode}
                    className="w-[120px]"
                    label={intl.get('megaAuto.operation.resize')}
                    options={resizeModeList}
                    onChange={(key) => {
                        onValueChange('resizeMode', key as IResizeMode);
                    }}
                />
            </div>
            {resizeMode === IResizeMode.control && <div>{renderNumberInput('width', width, 'width')}</div>}
            {resizeMode === IResizeMode.control && <div>{renderNumberInput('height', height, 'height')}</div>}
        </div>
    );
};

export default VizOperationBar;
