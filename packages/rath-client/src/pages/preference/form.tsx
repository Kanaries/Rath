import { Dropdown, TextField, Toggle } from "@fluentui/react";
import { observer } from "mobx-react-lite";
import { nanoid } from "nanoid";
import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import type { AnyDescriptor, PreferenceBoolDescriptor, PreferenceNumDescriptor, PreferencesSchema } from "./types";


const Container = styled.div`
    display: flex;
    flex-direction: row;
    overflow: hidden;
    height: 100%;
    > * {
        display: flex;
        flex-direction: column;
        overflow: auto;
        padding: 1em 1em 60%;
    }
    > .toc {
        width: 25%;
        margin-right: 1em;
        flex-grow: 0;
        flex-shrink: 0;
    }
    > .body {
        flex-grow: 1;
        flex-shrink: 1;
        header {
            cursor: default;
            font-size: 1.05rem;
            font-weight: 600;
            line-height: 1.6em;
            margin-block: 1em;
            :not(:first-child) {
                margin-top: 2.6em;
            }
        }
    }
`;

const TOCLink = styled.span<{ mode: FlatItem['mode'] }>`
    margin-block: 0.2em;
    cursor: pointer;
    user-select: none;
    font-size: 0.8rem;
    line-height: 1.5em;
    padding-left: ${({ mode }) => mode === 'title' ? '0.4em' : '1.4em'};
`;

type FlatItem = (
    | { id: string; mode: 'title'; text: string }
    | { id: string; mode: 'item'; item: AnyDescriptor; key: string }
);

const flat = (schema: PreferencesSchema): FlatItem[] => {
    const items: FlatItem[] = [];
    const entries = Object.entries(schema.properties).sort((a, b) => a[0].localeCompare(b[0]));

    let prevTitle: string | null = null;

    for (const [key, item] of entries) {
        const title = key.split('.')[0];
        if (title) {
            if (title !== prevTitle) {
                items.push({ id: nanoid(6), mode: 'title', text: title });
                prevTitle = title;
            }
        }
        if (item.type === 'object') {
            items.push(...flat(item));
            continue;
        }
        items.push({ id: nanoid(6), mode: 'item', item, key });
    }

    const conditions: { [key: string]: boolean } = {};

    for (const condition of schema.anyOf ?? []) {
        let matched = false;
        if ('properties' in condition) {
            let ok = true;
            for (const [key, decl] of Object.entries(condition.properties)) {
                const item = items.find(which => which.mode === 'item' && which.key === key) as { id: string; mode: 'item'; item: AnyDescriptor; key: string } | undefined;
                if (ok && decl['const'] !== item?.item.value) {
                    ok = false;
                }
            }
            matched = ok;
        }
        if ('required' in condition) {
            for (const key of condition.required!) {
                if (!(key in conditions)) {
                    conditions[key] = false;
                }
                if (conditions[key] === false) {
                    conditions[key] = matched;
                }
            }
        }
    }

    return items.filter(item => {
        if (item.mode === 'title') {
            return true;
        }
        return conditions[item.key] !== false;
    });
};

const FormItem = observer<{ value: FlatItem }>(function FormItem ({ value }) {
    const [input, setInput] = useState(`${value.mode === 'item' ? value.item.value : ''}`);
    const text = `${value.mode === 'item' ? value.item.value : ''}`;
    useEffect(() => {
        setInput(text);
    }, [text]);

    if (value.mode === 'title') {
        return (
            <header id={value.id}>{value.text}</header>
        );
    }
    switch (value.item.type) {
        case 'boolean': {
            const item = value.item as PreferenceBoolDescriptor & AnyDescriptor;
            return (
                <Toggle
                    id={value.id}
                    label={item.title}
                    checked={item.value}
                    onChange={(_, checked) => item.onChange(Boolean(checked))}
                />
            );
        }
        case 'number': {
            const item = value.item as PreferenceNumDescriptor & AnyDescriptor;
            const onGetErrorMessage = (data: string): string | undefined => {
                const num = Number(data || 'x');
                if (Number.isNaN(num)) {
                    return 'Requires number';
                }
                if ('exclusiveMinimum' in item && num <= item.exclusiveMinimum!) {
                    return `Input should be greater than ${item.exclusiveMinimum}`;
                }
                if ('exclusiveMaximum' in item && num >= item.exclusiveMaximum!) {
                    return `Input should be lower than ${item.exclusiveMaximum}`;
                }
                if ('minimum' in item && num < item.minimum!) {
                    return `Input should not be lower than ${item.minimum}`;
                }
                if ('maximum' in item && num > item.maximum!) {
                    return `Input should not be greater than ${item.maximum}`;
                }
            };
            return (
                <TextField
                    id={value.id}
                    label={item.title}
                    value={input}
                    onChange={(_, data) => {
                        if (Number.isFinite(Number(data))) {
                            setInput(data ?? '');
                        }
                    }}
                    onBlur={() => {
                        setInput(`${item.value}`);
                    }}
                    onKeyDown={e => {
                        if (e.key === 'Enter') {
                            if (!onGetErrorMessage(input)) {
                                const val = Number(input);
                                if (val !== item.value) {
                                    item.onChange(val);
                                }
                            }
                            (e.target as HTMLInputElement).blur();
                        }
                    }}
                    onGetErrorMessage={onGetErrorMessage}
                />
            );
        }
        case 'enum': {
            return (
                <Dropdown
                    id={value.id}
                    label={value.item.title}
                    options={value.item.options.map(opt => ({
                        key: opt,
                        text: `${opt}`,
                    }))}
                    selectedKey={value.item.value}
                    // @ts-expect-error this is expected
                    onChange={(_, option) => option?.key !== undefined && value.item.onChange(option.key)}
                />
            );
        }
        default: {
            return null;
        }
    }
});

const Form = observer<{ schema: PreferencesSchema }>(function Form ({ schema }) {
    const items = useMemo(() => flat(schema), [schema]);
    return (
        <Container>
            <div className="toc">
                {items.map(item => (
                    <TOCLink
                        key={item.id}
                        mode={item.mode}
                        onClick={() => {
                            const target = document.getElementById(
                                `${item.id}-label`
                            ) || document.querySelector(`*[for="${item.id}"]`) || document.getElementById(item.id);
                            target?.scrollIntoView({
                                behavior: 'smooth',
                                block: 'start',
                            });
                        }}
                    >
                        {item.mode === 'item' ? item.item.title : item.text}
                    </TOCLink>
                ))}
            </div>
            <div className="body">
                {items.map(item => (
                    <FormItem key={item.id} value={item} />
                ))}
            </div>
        </Container>
    );
});


export default Form;
