import React from 'react';
import styled from 'styled-components';
import { PrimaryButton, TextField } from '@fluentui/react';

const ActionButton = styled.div`
    > label {
        font-weight: 600;
        display: inline-block;
        color: rgb(50, 49, 48);
        font-size: 14px;
        padding: 5px 0;
        font-family: 'Segoe UI', 'Segoe UI Web (West European)', 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto,
            'Helvetica Neue', sans-serif;
        -webkit-font-smoothing: antialiased;
    }
    > div {
        display: flex;
        > div:first-child {
            /* width: 200px; */
        }
        > div:last-child {
            flex: 1;
            margin-left: 10px;
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
    return (
        <ActionButton>
            <label>{label}</label>
            <div>
                <div>
                    <TextField
                        value={value}
                        placeholder={placeholder}
                        onChange={(e, data) => {
                            onChange && onChange(data);
                        }}
                    />
                </div>
                <div>
                    <PrimaryButton style={{ width: '100%' }} disabled={isDisable} onClick={onButtonClick}>
                        {buttonLabel}
                    </PrimaryButton>
                </div>
            </div>
        </ActionButton>
    );
};

export default ActionTextField;
