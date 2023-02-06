// Copyright (C) 2023 observedobserver
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import { DefaultButton, PrimaryButton } from "@fluentui/react";
import { BaseTable, Classes } from "ali-react-table";
import styled from "styled-components";

export const DATA_TABLE_STYLE_CONFIG = {
    SELECT_COLOR: '#b7eb8f',
    TABLE_INNER_STYLE: {
        height: 600,
        overflow: 'auto',
    }
} as const;

export const CustomBaseTable = styled(BaseTable)`
    --header-bgcolor: #ffffff !important;
    --bgcolor: rgba(0, 0, 0, 0);
    --border-color: #f2f2f2;
    --row-height: 38px;
    .${Classes.tableHeaderCell} {
        position: relative;
    }
    thead {
        vertical-align: top;
        th {
            padding: 0px 0px 8px 0px;
        }
    }
    td {
        cursor: text;
    }
`;

export const Tag = styled.div<{color?: string; bgColor?: string}>`
    display: inline-block;
    padding: 0px 8px;
    border-radius: 2px;
    background-color: ${props => props.bgColor || '#f3f3f3'};
    color: ${props => props.color || '#000000'};
    font-size: 12px;
    margin-right: 4px;
    border-radius: 12px;
`;

export const TextPatternCard = styled.div`
    padding: 8px;
    border: 1px solid #f3f3f3;
    border-radius: 2px;
    overflow: hidden;
    margin: 8px 0px;
    > .tp-content {
        margin: 1em 0em;
        > span {
            border: 1px solid #f3f3f3;
            display: inline-block;
            overflow-wrap: break-all;
            word-break: break-all;
            white-space: pre-wrap;
        }
    }
    .sl-text {
        background-color: ${DATA_TABLE_STYLE_CONFIG.SELECT_COLOR};
    }
    .ph-text,
    .pe-text {
        background-color: #fed7aa;
    }
`;
export const MiniButton = styled(DefaultButton)`
    height: 26px;
    font-size: 12px;
`;

export const MiniPrimaryButton = styled(PrimaryButton)`
    height: 26px;
    font-size: 12px;
`;
