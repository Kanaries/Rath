import React from "react";
export interface Option {
  id: string;
  name: string;
}
interface SelectProps {
  options: Option[];
  onChange: (value: string) => void;
  value: string;
}

const Select: React.FC<SelectProps> = (props) => {
  const { options = [], onChange, value } = props;
  return (
    <select
      name="select-com"
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
      }}
    >
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.name}
        </option>
      ))}
    </select>
  );
};

export default Select;
