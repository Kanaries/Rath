import React from 'react';
import { RathSelect, RathSelectOption } from '../../components/rath-ui/rath-select';
import { Input } from '../../components/ui/input';
import { Slider } from '../../components/ui/slider';
import { Switch } from '../../components/ui/switch';
import { LabelWithDesc } from '../../components/labelTooltip';
import { IForm, IFormItem } from './config';

export function RenderFormItem(props: { item: IFormItem; onChange: (val: any) => void; value: any }) {
    const { item, onChange, value } = props;
    switch (item.renderType) {
        case 'text':
            return <Input value={value} onChange={(e) => onChange(e.target.value)} />;
        case 'dropdown':
            return (
                <RathSelect
                    options={(item.options || []) as RathSelectOption[]}
                    selectedKey={value}
                    onChange={(key) => {
                        onChange(key);
                    }}
                />
            );
        case 'slider':
            return (
                <div className="flex min-w-0 items-center gap-3">
                    <Slider
                        min={item.range ? item.range[0] : 0}
                        max={item.range ? item.range[1] : 1}
                        step={item.step}
                        value={[value]}
                        thumbLabels={[item.title]}
                        onValueChange={(v) => {
                            onChange(v[0]);
                        }}
                    />
                    <output className="w-16 shrink-0 text-right text-sm tabular-nums text-muted-foreground">{value}</output>
                </div>
            );
        case 'toggle':
            return (
                <Switch
                    checked={value}
                    onCheckedChange={(v) => {
                        onChange(Boolean(v));
                    }}
                />
            );
        default:
            return null;
    }
}

interface DynamicFormProps {
    form: IForm;
    onChange: (key: string, val: any) => void;
    values: { [key: string]: any };
}
const DynamicForm: React.FC<DynamicFormProps> = (props) => {
    const { form, values, onChange } = props;
    return (
        <div className="divide-y">
            {form.items.map((item) => (
                <div key={item.key} className="grid grid-cols-[minmax(0,1fr)_minmax(12rem,1fr)] items-center gap-4 py-4">
                    <LabelWithDesc label={item.title} description={item.description} />
                    <div className="min-w-0">
                        <RenderFormItem
                            item={item}
                            onChange={(val) => {
                                onChange(item.key, val);
                            }}
                            value={values[item.key]}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default DynamicForm;
