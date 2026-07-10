import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import { IFieldMeta } from '../../interfaces';
import { RathIcon } from '../icons';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Input } from '../ui/input';

export const PillPlaceholder = styled.div`
    color: #000;
    -ms-user-select: none;
    -webkit-user-select: none;
    border-color: rgb(229, 231, 235);
    /* border-radius: 10px; */
    border-style: dashed;
    border-radius: 10px;
    border-style: solid;
    border-width: 1px;
    box-sizing: border-box;
    cursor: pointer;
    font-size: 12px;
    height: 20px;
    min-width: 150px;
    padding: 0 10px;
    user-select: none;
    margin-right: 4px;
    display: flex;
    align-items: center;
    -webkit-align-items: center;
    overflow-y: hidden;
    justify-content: center;
    .cancel-icon {
        cursor: pointer;
    }
`;

interface FieldOption {
    key: string;
    text: string;
    disabled?: boolean;
}

export function fields2options(fields: readonly IFieldMeta[]): FieldOption[] {
    return fields.map((f) => ({
        key: f.fid,
        text: f.name || f.fid,
    }));
}

interface FieldPlaceholderProps {
    fields: readonly IFieldMeta[];
    onAdd: (fid: string) => void;
}
const FieldPlaceholder: React.FC<FieldPlaceholderProps> = (props) => {
    const { fields, onAdd } = props;
    const [showContextualMenu, setShowContextualMenu] = useState<boolean>(false);

    const [fieldOptions, setFieldOptions] = useState<FieldOption[]>(fields2options(fields));

    useEffect(() => {
        setFieldOptions(fields2options(fields));
    }, [fields]);

    const onChange = React.useCallback(
        (ev: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = ev.target.value;
            if (newValue === '') {
                setFieldOptions(fields2options(fields));
                return;
            }
            const filteredItems = fields2options(fields).filter((item) => item.text.toLowerCase().includes(newValue.toLowerCase()));

            if (!filteredItems.length) {
                filteredItems.push({
                    key: 'no_results',
                    text: 'No vars found',
                    disabled: true,
                });
            }

            setFieldOptions(filteredItems);
        },
        [fields]
    );

    return (
        <DropdownMenu open={showContextualMenu} onOpenChange={setShowContextualMenu}>
            <DropdownMenuTrigger asChild>
                <PillPlaceholder>+ {intl.get('common.addVar')}</PillPlaceholder>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="start">
                <div className="border-b p-1" onClick={(e) => e.stopPropagation()}>
                    <div className="relative">
                        <RathIcon name="Search" className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            className="pl-7"
                            aria-label={intl.get('common.search.searchFields')}
                            placeholder={intl.get('common.search.searchFields')}
                            onChange={onChange}
                        />
                    </div>
                </div>
                {fieldOptions.map((item) => (
                    <DropdownMenuItem
                        key={item.key}
                        disabled={item.disabled}
                        onSelect={() => {
                            if (!item.disabled) {
                                onAdd(item.key);
                                setShowContextualMenu(false);
                            }
                        }}
                    >
                        {item.disabled && <RathIcon name="SearchIssue" title={intl.get('common.search.notFound')} className="mr-2" />}
                        <span className="truncate">{item.text}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default FieldPlaceholder;
