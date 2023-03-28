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
import intl from 'react-intl-universal';
import styled from 'styled-components';
import { Icon } from '@fluentui/react';
import { IDataSourceType } from '../../global';

const CardGrid = styled.div`
    display: flex;
    flex-wrap: wrap;
    /* display: grid; */
    /* grid-template-columns: repeat(2, minmax(0, 1fr)); */
`;

const OptionCard = styled.div`
    background-color: #fff;
    /* padding: 12px; */
    margin: 6px;
    /* display: flex; */
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    /* box-shadow: rgba(50, 50, 105, 0.08) 0px 2px 5px 0px, rgba(0, 0, 0, 0.02) 0px 1px 1px 0px; */
    margin-right: 1em;
    padding: 1em 2em;
    > .op-logo {
        /* flex-grow: 0;
        flex-shrink: 0; */
        width: 5rem;
        display: flex;
        justify-content: center;
        transition: transform 80ms;
        max-width: 100%;
        > img {
            /* width: 64px; */
            /* width: 10rem; */
            max-width: 100%;
        }
        > .logo-icon {
            /* width: 3rem; */
            font-size: 2rem;
        }
    }
    .op-content {
        /* flex-grow: 1;
        flex-shrink: 1; */
        margin-top: 1em;
        text-align: center;
        /* display: flex; */
        /* align-items: center; */
    }
    filter: saturate(0.9);
    transition: filter 80ms, background-color 80ms;
    :not([aria-disabled="true"]):hover {
        background-color: transparent;
        filter: saturate(1.2);
        > .op-logo {
            transform: scale(1.1);
        }
    }
    cursor: pointer;
    &[aria-disabled="true"] {
        filter: opacity(0.6);
        cursor: not-allowed;
    }
`;

interface SupportedSourceProps {
    onSelected: (key: string | number) => void;
}
const SupportedSources: React.FC<SupportedSourceProps> = (props) => {
    const { onSelected } = props;
    const fileText = intl.get(`dataSource.importData.type.${IDataSourceType.FILE}`);
    const restfulText = intl.get(`dataSource.importData.type.${IDataSourceType.RESTFUL}`);
    const demoText = intl.get(`dataSource.importData.type.${IDataSourceType.DEMO}`);
    const dbText = intl.get(`dataSource.importData.type.${IDataSourceType.DATABASE}`);
    const historyText = intl.get('common.history');

    const options = [
        {
            key: IDataSourceType.LOCAL,
            text: historyText,
            iconProps: { iconName: 'History' },
            iconImage: () => <img src="/assets/icons/usb-drive.svg" alt="" />,
        },
        {
            key: IDataSourceType.FILE,
            text: fileText,
            iconProps: { iconName: 'FabricUserFolder' },
            // iconImage: () => <FolderIcon />,
            iconImage: () => <img src="/assets/icons/folders.svg" alt="" />,
        },
        {
            key: IDataSourceType.DEMO,
            text: demoText,
            iconProps: { iconName: 'FileTemplate' },
            iconImage: () => <img src="/assets/icons/joystick.svg" alt="" />,
        },
        {
            key: IDataSourceType.CLOUD,
            text: intl.get(`dataSource.importData.type.${IDataSourceType.CLOUD}`),
            iconProps: { iconName: 'CloudDownload' },
            iconImage: () => <img src="/assets/icons/cloud-folder.svg" alt="" />,
        },
        {
            key: IDataSourceType.DATABASE,
            text: dbText,
            iconProps: { iconName: 'Database' },
            iconImage: () => <img src="/assets/icons/data-server.svg" alt="" />,
        },
        {
            key: IDataSourceType.AIRTABLE,
            text: 'AirTable',
            iconProps: { iconName: 'Table' },
            iconImage: () => <img src="/assets/icons/airtable.svg" alt="" />,
            disabled: false,
        },
        {
            key: IDataSourceType.RESTFUL,
            text: restfulText,
            iconProps: { iconName: 'Cloud' },
            iconImage: () => <img src="/assets/icons/cloud-computing.svg" alt="" />,
        },
        {
            key: IDataSourceType.OLAP,
            text: 'OLAP',
            iconProps: { iconName: 'TripleColumn' },
            iconImage: () => <img src="/assets/icons/cloud-computing_1.svg" alt="" />,
            disabled: true,
        },
    ];
    return (
        <div>
            <CardGrid>
                {options.map((op) => (
                    <OptionCard
                        key={op.key}
                        role="button"
                        aria-disabled={op.disabled}
                        tabIndex={0}
                        onClick={() => {
                            if (!op.disabled) {
                                onSelected(op.key);
                            }
                        }}
                    >
                        <div className="op-logo">
                            {op.iconImage && op.iconImage()}
                            {!op.iconImage && <Icon className="logo-icon" {...op.iconProps} />}
                        </div>
                        <div className="op-content">{op.text}</div>
                    </OptionCard>
                ))}
            </CardGrid>
        </div>
    );
};

export default SupportedSources;
