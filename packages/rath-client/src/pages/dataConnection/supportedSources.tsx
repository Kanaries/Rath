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
import { publicAssetUrl } from 'runtime-env';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { IDataSourceType } from '../../global';

interface SupportedSourceProps {
    onSelected: (key: string | number) => void;
}
const SupportedSources: React.FC<SupportedSourceProps> = (props) => {
    const { onSelected } = props;
    const fileText = intl.get(`dataSource.importData.type.${IDataSourceType.FILE}`);
    const restfulText = intl.get(`dataSource.importData.type.${IDataSourceType.RESTFUL}`);
    const demoText = intl.get(`dataSource.importData.type.${IDataSourceType.DEMO}`);
    const dbText = intl.get(`dataSource.importData.type.${IDataSourceType.DATABASE}`);

    const options = [
        {
            key: IDataSourceType.FILE,
            text: fileText,
            // iconImage: () => <FolderIcon />,
            iconImage: () => <img className="h-12 w-12 rounded-sm" src={publicAssetUrl('assets/icons/folders.svg')} alt="" />,
        },
        {
            key: IDataSourceType.DEMO,
            text: demoText,
            iconImage: () => <img className="h-12 w-12 rounded-sm" src={publicAssetUrl('assets/icons/joystick.svg')} alt="" />,
        },
        {
            key: IDataSourceType.DATABASE,
            text: dbText,
            iconImage: () => <img className="h-12 w-12 rounded-sm" src={publicAssetUrl('assets/icons/data-server.svg')} alt="" />,
        },
        {
            key: IDataSourceType.AIRTABLE,
            text: 'AirTable',
            iconImage: () => <img className="h-12 w-12 rounded-sm" src={publicAssetUrl('assets/icons/airtable.svg')} alt="" />,
            disabled: false,
        },
        {
            key: IDataSourceType.RESTFUL,
            text: restfulText,
            iconImage: () => <img className="h-12 w-12 rounded-sm" src={publicAssetUrl('assets/icons/cloud-computing.svg')} alt="" />,
        },
    ];

    return (
        <div className="flex flex-wrap gap-[22px]">
            {options.map((op) => (
                <Card
                    key={op.key}
                    role="button"
                    aria-disabled={op.disabled}
                    tabIndex={op.disabled ? -1 : 0}
                    className="w-[480px] max-w-full cursor-pointer transition-colors hover:bg-accent/40 aria-disabled:cursor-default aria-disabled:opacity-50"
                    onClick={() => {
                        if (!op.disabled) {
                            onSelected(op.key);
                        }
                    }}
                    onKeyDown={(event) => {
                        if (!op.disabled && (event.key === 'Enter' || event.key === ' ')) {
                            event.preventDefault();
                            onSelected(op.key);
                        }
                    }}
                >
                    <CardHeader className="flex-row items-center gap-3 space-y-0">
                        {op.iconImage && op.iconImage()}
                        <div className="min-w-0">
                            <CardTitle className="text-sm">{op.text}</CardTitle>
                            <CardDescription className="text-xs">Developer</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="m-0 text-sm">{intl.get(`dataSource.importData.sources.${op.key}.desc`)}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

export default SupportedSources;
