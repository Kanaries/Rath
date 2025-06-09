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

import intl from 'react-intl-universal';
import { Icon } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import dayjs from 'dayjs';
import type { FC } from 'react';
import styled from 'styled-components';
import { Caption1, Card, CardHeader, Text } from '@fluentui/react-components';
// import { MoreHorizontal } from 'lucide-react';
import { IDBMeta } from '../../../utils/storage';
import { RathDemoVirtualExt } from '../demo';
import { IDataSourceType } from '../../../global';
import getFileIcon from './get-file-icon';

const Desc = styled.p`
    font-size: 12px;
`;

export function formatSize(kb: number) {
    if (kb < 1024) {
        return `${kb}KB`;
    }
    if (kb < 1024 * 1024) {
        return `${(kb / 1024).toFixed(2)}MB`;
    }
    return `${(kb / 1024 / 1024).toFixed(2)}GB`;
}

export interface IHistoryListItemProps {
    file: IDBMeta;
    rowIndex: number;
    colIndex: number;
    handleClick?: (item: IDBMeta) => void;
    handleClearClick?: (itemId: string) => void;
    handleRefresh?: () => void;
    appearance: 'filled' | 'outline';
}

const HistoryListItem: FC<IHistoryListItemProps> = ({ file, rowIndex, colIndex, handleClick, handleClearClick, handleRefresh, appearance }) => {
    const ext = file.name.endsWith(RathDemoVirtualExt) ? RathDemoVirtualExt : /\.([^./]+)$/.exec(file.name)?.[1];
    const isRathDemo = ext === RathDemoVirtualExt;
    const name = isRathDemo ? file.name.replace(new RegExp(`\\.${RathDemoVirtualExt.replaceAll(/\./g, '\\.')}$`), '') : file.name;

    return (
        <Card
            // className={styles.card}
            onClick={() => handleClick?.(file)}
            appearance={appearance}
        >
            <CardHeader
                image={<Icon iconName={getFileIcon(isRathDemo ? '' : file.name)} />}
                header={<Text weight="semibold">{name}</Text>}
                description={
                    <Caption1>{`${
                        ext ? `${isRathDemo ? `Rath ${intl.get(`dataSource.importData.type.${IDataSourceType.DEMO}`)}` : ext} - ` : ''
                    }${formatSize(file.size)}`}</Caption1>
                }
                // action={<Button appearance="transparent" icon={<MoreHorizontal />} aria-label="More options" />}
            />

            <Desc>{`${intl.get('dataSource.upload.lastOpen')}: ${dayjs(file.editTime).toDate().toLocaleString()}`}</Desc>
        </Card>
    );
};

export default observer(HistoryListItem);
