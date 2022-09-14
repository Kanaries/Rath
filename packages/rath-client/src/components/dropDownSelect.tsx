import React from 'react';
import styled from 'styled-components';

const Cont = styled.div<{border?: boolean}>`
    border: 1px solid ${props => props.border ? 'rgba(0, 0, 0, 0.2)' : 'transparent'};
    border-radius: 1px;
    box-sizing: border-box;
    display: inline-block;
    height: 0;
    min-height: 24px;
    position: relative;
    font-size: 12px;
    color: #333;
    > select {
        background-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2218%22%20height%3D%2218%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M5.8%207.3l3.5%204.6c.1.1.2.1.3%200l3.6-4.6c.1-.2%200-.3-.2-.3H6c-.2%200-.3.1-.2.3z%22%2F%3E%3C%2Fsvg%3E") !important;
        padding-right: 25px;
        > option{
            -moz-appearance: none;
            -webkit-appearance: none;
            background: transparent no-repeat right center;
            border: none;
            border-radius: 0;
            color: #333;
            cursor: inherit;
            font-family: inherit;
            font-size: inherit;
            height: 100%;
            outline: none;
            padding-left: 7px;
            width: 100%;
            font-weight: normal;
            display: block;
            white-space: nowrap;
            min-height: 1.2em;
            padding: 0px 2px 1px;
        }
    }
    .select-cus-style{
        -webkit-appearance: none;
        background: transparent no-repeat right center;
        border: none;
        border-radius: 0;
        color: #333;
        cursor: inherit;
        font-family: inherit;
        font-size: inherit;
        height: 100%;
        outline: none;
        padding-left: ${props => props.border ? '7px' : '0px'};
        width: 100%;
    }
`
interface IDropDownSelect {
    value?: string | number | readonly string[] | undefined;
    onChange?: React.ChangeEventHandler<HTMLSelectElement>;
    border?: boolean;
}

const DropDownSelect: React.FC<IDropDownSelect> = props => {
    const { value, onChange, border } = props;
    return <Cont border={border}>
        <select className="select-cus-style"
            value={value}
            onChange={onChange}
            aria-readonly="true">
            {
                props.children
            }
        </select>
    </Cont>
}

export default DropDownSelect;
