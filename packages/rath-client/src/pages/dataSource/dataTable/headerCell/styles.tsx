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

import styled from "styled-components";
import { RATH_THEME_CONFIG } from "../../../../theme";

export const HEADER_CELL_STYLE_CONFIG = {
    SUGGESTION_BUTTON: {
        transform: 'scale(0.75)',
        margin: '-4px -18px',
        flexShrink: 0,
    },
    DELETE_BUTTON: {
        iconName: 'Delete',
        style: {
            color: '#c50f1f',
        },
    }
} as const;

export const HeaderCellContainer = styled.div`
    .others {
        position: relative;
        padding: 12px;
    }
    .bottom-bar {
        position: absolute;
        height: 4px;
        left: 0px;
        right: 0px;
        top: 0px;
    }
    .info-container {
        min-height: 50px;
    }
    .viz-container {
        height: 100px;
        overflow: hidden;
    }
    .dim {
        background-color: ${RATH_THEME_CONFIG.dimensionColor};
    }
    .mea {
        background-color: ${RATH_THEME_CONFIG.measureColor};
    }
    .disable {
        background-color: ${RATH_THEME_CONFIG.disableColor};
    }
    .header-row {
        display: flex;
        flex-wrap: nowrap;
        .header {
            margin-top: 0px;
            margin-bottom: 0px;
            font-size: 18px;
            font-weight: 500;
            line-height: 36px;
            flex-grow: 1;
            max-width: 160px;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
        }
        .edit-icon {
            flex-shrink: 0;
            flex-grow: 0;
        }
    }
    .comment-row {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 12px;
        color: #666666aa;
        line-height: 1.5em;
        height: 1.5em;
        padding-inline: 0.1em;
        margin-bottom: 0.6em;
    }
    .checkbox-container {
        display: flex;
        align-items: center;
        margin-top: 2px;
        label {
            margin-right: 6px;
        }
    }
`;