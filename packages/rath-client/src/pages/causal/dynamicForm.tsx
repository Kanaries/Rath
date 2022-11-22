import { Dropdown, TextField, Slider, Toggle } from '@fluentui/react';
import React from 'react';
import { LabelWithDesc } from '../../components/labelTooltip';
import { IForm, IFormItem } from './config';

export function RenderFormItem(props: { item: IFormItem; onChange: (val: any) => void; value: any }) {
    const { item, onChange, value } = props;
    switch (item.renderType) {
        case 'text':
            return <TextField label={item.title} value={value} onChange={(e, v) => onChange(v)} />;
        case 'dropdown':
            return (
                <Dropdown
                    // label={item.title}
                    options={item.options || []}
                    selectedKey={value}
                    onChange={(e, o) => {
                        o && onChange(o.key);
                    }}
                    // onRenderLabel={makeRenderLabelHandler(item.description)}
                />
            );
        case 'slider':
            return (
                <Slider
                    // label={item.title}
                    min={item.range ? item.range[0] : 0}
                    max={item.range ? item.range[1] : 1}
                    step={item.step}
                    value={value}
                    showValue
                    onChange={(v) => {
                        onChange(v);
                    }}
                />
            );
        case 'toggle':
            return (
                <Toggle
                    // label={item.title}
                    checked={value}
                    onChange={(e, v) => {
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
        <table>
            <tbody>
                {form.items.map((item) => {
                    return (
                        <tr key={item.key} style={{ borderBottom: '1px solid #ccc' }}>
                            <td align="right" style={{ padding: '1em 2em', verticalAlign: 'middle' }}>
                                <LabelWithDesc label={item.title} description={item.description} />
                            </td>
                            <td style={{ padding: '1em' }}>
                                <RenderFormItem
                                    item={item}
                                    onChange={(val) => {
                                        onChange(item.key, val);
                                    }}
                                    value={values[item.key]}
                                />
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};

export default DynamicForm;
