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

import React from 'react';
import styled from "styled-components";
import { Button, ButtonProps } from '../../../components/ui/button';

export const DATA_TABLE_STYLE_CONFIG = {
    SELECT_COLOR: '#b7eb8f',
    EXCLUDE_COLOR: '#ffccc7',
    TABLE_INNER_STYLE: {
        height: 600,
        overflow: 'auto',
    }
} as const;

export const DataSourceTableContainer = styled.div`
    min-width: 0;
    flex: 1 1 auto;

    table {
        border-color: #f2f2f2;
        background-color: transparent;
    }
    thead th {
        position: relative;
        vertical-align: top;
        background-color: #fff;
        padding: 0px 0px 8px 0px;
    }
    td {
        height: 38px;
        cursor: text;
        .tp-exclude-btn {
            opacity: 0;
            border: none;
            background-color: rgba(0, 0, 0, 0.06);
            border-radius: 3px;
            cursor: pointer;
            font-size: 11px;
            line-height: 16px;
            padding: 0 4px;
            margin-left: 6px;
            vertical-align: middle;
            user-select: none;
            transition: opacity 0.12s;
            &:hover {
                background-color: rgba(0, 0, 0, 0.14);
            }
        }
        /* content lives in ::after so the button never contributes a text node:
           text selections across the cell keep their original offsets */
        .tp-exclude-btn::after {
            content: '✕';
        }
        .tp-exclude-btn.tp-exclude-btn-restore::after {
            content: '↺';
        }
        &:hover .tp-exclude-btn {
            opacity: 1;
        }
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
interface MiniButtonProps extends Omit<ButtonProps, 'children'> {
    text?: React.ReactNode;
}

export const MiniButton = styled(({ text, ...props }: MiniButtonProps) => (
    <Button type="button" variant="outline" size="sm" {...props}>
        {text}
    </Button>
))`
    height: 26px;
    font-size: 12px;
`;

export const MiniPrimaryButton = styled(({ text, ...props }: MiniButtonProps) => (
    <Button type="button" size="sm" {...props}>
        {text}
    </Button>
))`
    height: 26px;
    font-size: 12px;
`;
