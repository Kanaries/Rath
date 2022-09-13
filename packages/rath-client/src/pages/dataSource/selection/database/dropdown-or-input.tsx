import { Dropdown, IDropdownOption, TextField } from 'office-ui-fabric-react';
import type { FC } from 'react';
import intl from 'react-intl-universal';
import { inputWidth } from '.';


interface DropdownOrInputProps {
    name: string;
    options: IDropdownOption[] | null;
    value: string | null | undefined;
    setValue: (key: string) => void;
    updateInputTime: () => void;
}

const DropdownOrInput: FC<DropdownOrInputProps> = ({
    name,
    options,
    value,
    setValue,
    updateInputTime,
}) => {
    return options ? (
        <Dropdown
            label={intl.get(name)}
            style={{ width: inputWidth }}
            options={options}
            selectedKey={value}
            required
            onChange={(_, item) => {
                if (item) {
                    setValue(item.key as string);
                }
            }}
        />
    ) : (
        <TextField
            name={name}
            label={intl.get(name)}
            style={{ width: inputWidth }}
            value={value as string | undefined}
            required
            onChange={(_, key) => {
                updateInputTime();
                
                if (typeof key === 'string') {
                    setValue(key);
                }
            }}
        />
    );
};

export default DropdownOrInput;
