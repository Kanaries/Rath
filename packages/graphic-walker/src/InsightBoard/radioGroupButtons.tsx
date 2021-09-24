import React from 'react';
import styled from 'styled-components';

const RGBContainer = styled.div`
    font-size: 14px;
    .option {
        padding: 0.8em;
        margin: 4px;
        border: 1px solid #f0f0f0;
        background-color: #f0f0f0;
        cursor: pointer;
    }
    .choosen.option {
        background-color: #fff;
    }
`;

export interface RGBOption {
    label: string;
    value: any;
}

interface RadioGroupButtonsProps {
    options: RGBOption[];
    onChange?: (value: any, index: number) => void;
    choosenIndex: number;
}

const RadioGroupButtons: React.FC<RadioGroupButtonsProps> = (props) => {
    const { options, onChange, choosenIndex } = props;
    return (
        <RGBContainer>
            {options.map((op, i) => (
                <div
                    key={i}
                    className={`${choosenIndex === i ? 'choosen' : ''} option`}
                    onClick={() => {
                        if (onChange) {
                            onChange(op.value, i);
                        }
                    }}
                >
                    {op.label}
                </div>
            ))}
        </RGBContainer>
    );
};

export default RadioGroupButtons;
