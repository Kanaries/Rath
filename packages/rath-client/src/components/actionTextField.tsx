import React, { useId } from 'react';
import styled from 'styled-components';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

const ActionButton = styled.div`
    > .action-text-field-label {
        display: inline-flex;
        padding: 5px 0;
    }
    > .action-text-field-row {
        display: flex;
        gap: 10px;
        > .action-text-field-input {
            flex: 0 1 auto;
        }
        > .action-text-field-button {
            flex: 1;
        }
    }
`;
interface ActionTextFieldProps {
    label: string;
    placeholder?: string;
    buttonLabel: string;
    value: string;
    buttonDisabled?: boolean;
    isDisable: boolean;
    onChange?: (val: string | undefined) => void;
    onButtonClick?: () => void;
}
const ActionTextField: React.FC<ActionTextFieldProps> = (props) => {
    const { label, placeholder, buttonLabel, value, isDisable, onButtonClick, onChange } = props;
    const inputId = useId();

    return (
        <ActionButton>
            <Label className="action-text-field-label" htmlFor={inputId}>{label}</Label>
            <div className="action-text-field-row">
                <div className="action-text-field-input">
                    <Input
                        id={inputId}
                        value={value}
                        placeholder={placeholder}
                        onChange={(e) => {
                            onChange?.(e.currentTarget.value);
                        }}
                    />
                </div>
                <div className="action-text-field-button">
                    <Button className="w-full" disabled={isDisable} onClick={onButtonClick}>
                        {buttonLabel}
                    </Button>
                </div>
            </div>
        </ActionButton>
    );
};

export default ActionTextField;
