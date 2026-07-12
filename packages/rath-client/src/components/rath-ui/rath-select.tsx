import * as React from 'react';
import { cn } from 'utils/cn';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectLabel, SelectSeparator, SelectTrigger } from '../ui/select';

export interface RathSelectOption {
    key: string | number;
    text: string;
    disabled?: boolean;
    itemType?: 'divider' | 'header';
}

interface RathSelectProps {
    options: RathSelectOption[];
    selectedKey?: string | number | null;
    onChange?: (key: string | number, option: RathSelectOption) => void;
    label?: React.ReactNode;
    ariaLabel?: string;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    triggerClassName?: string;
    renderItem?: (option: RathSelectOption) => React.ReactNode;
    renderValue?: (option?: RathSelectOption) => React.ReactNode;
}

function optionValue(option: RathSelectOption): string {
    return String(option.key);
}

export function RathSelect({
    options,
    selectedKey,
    onChange,
    label,
    ariaLabel,
    placeholder,
    disabled,
    className,
    triggerClassName,
    renderItem,
    renderValue,
}: RathSelectProps) {
    const id = React.useId();
    const labelId = `${id}-label`;
    const isTextLabel = typeof label === 'string';
    const selectedValue = selectedKey === null || selectedKey === undefined ? undefined : String(selectedKey);
    const selectedOption = options.find((option) => option.itemType === undefined && optionValue(option) === selectedValue);
    const displayValue = selectedOption ? renderValue?.(selectedOption) ?? selectedOption.text : renderValue?.(undefined) ?? placeholder;

    return (
        <div className={cn('grid gap-1.5', className)}>
            {isTextLabel && <Label htmlFor={id}>{label}</Label>}
            {label && !isTextLabel && <div id={labelId}>{label}</div>}
            <Select
                value={selectedValue}
                disabled={disabled}
                onValueChange={(value) => {
                    const option = options.find((item) => item.itemType === undefined && optionValue(item) === value);
                    if (option) {
                        onChange?.(option.key, option);
                    }
                }}
            >
                <SelectTrigger
                    id={id}
                    className={triggerClassName}
                    aria-label={ariaLabel ?? (isTextLabel ? label : undefined)}
                    aria-labelledby={label && !isTextLabel ? labelId : undefined}
                >
                    <span className={cn('truncate', selectedOption ? undefined : 'text-muted-foreground')}>{displayValue}</span>
                </SelectTrigger>
                <SelectContent>
                    {options.map((option, index) => {
                        if (option.itemType === 'divider') {
                            return <SelectSeparator key={`${option.key}-${index}`} />;
                        }
                        if (option.itemType === 'header') {
                            return <SelectLabel key={option.key}>{option.text}</SelectLabel>;
                        }
                        return (
                            <SelectItem key={option.key} value={optionValue(option)} disabled={option.disabled}>
                                {renderItem?.(option) ?? option.text}
                            </SelectItem>
                        );
                    })}
                </SelectContent>
            </Select>
        </div>
    );
}
