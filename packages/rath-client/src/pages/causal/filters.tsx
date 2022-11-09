import { IconButton } from "@fluentui/react";
import type { FC } from "react";
import styled from "styled-components";
import type { IFieldMeta, IFilter } from "../../interfaces";


interface FieldCellProps {
  field: IFieldMeta;
  data: IFilter;
  remove: () => void;
}

const Cell = styled.div`
    user-select: none;
    font-size: 0.8rem;
    margin: 0.2em 0;
    padding: 0.6em 1.2em;
    padding-right: 4em;
    /* border: 1px solid #8888; */
    box-shadow: 0 0.8px 1.8px 0 rgb(0 0 0 / 26%), 0 0.3px 0.9px 0 rgb(0 0 0 / 22%);
    margin-right: 2em;
    position: relative;
    > div {
        padding: 0.2em 0;
        line-height: 1.6em;
        min-height: 1.6em;
    }
    > button {
        position: absolute;
        right: 0;
        top: 0;
        color: #da3b01;
        :hover {
            color: #da3b01;
        }
    }
`;


export const FilterCell: FC<FieldCellProps> = ({ field, data, remove }) => {
    const filterDesc = `∈ ${
        data.type === 'range' ? `[${data.range.join(',')}]` : `{${data.values.map(v => JSON.stringify(v)).join(',')}}`
    }`;

    return (
        <Cell>
            <div>{field.name || field.fid}</div>
            <div>{filterDesc}</div>
            <IconButton
                iconProps={{
                    iconName: 'Delete',
                }}
                onClick={remove}
            />
        </Cell>
    );
};