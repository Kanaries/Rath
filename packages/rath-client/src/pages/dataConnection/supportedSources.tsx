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
import { Button, Card, CardHeader, makeStyles, shorthands, tokens, Text, Caption1 } from '@fluentui/react-components';
import { MoreHorizontal } from 'lucide-react';
import { IDataSourceType } from '../../global';

const useStyles = makeStyles({
    main: {
        ...shorthands.gap('22px'),
        display: 'flex',
        flexWrap: 'wrap',
    },

    title: {
        ...shorthands.margin(0, 0, '12px'),
    },

    description: {
        ...shorthands.margin(0, 0, '12px'),
    },

    card: {
        width: '480px',
        maxWidth: '100%',
    },

    caption: {
        color: tokens.colorNeutralForeground3,
    },

    logo: {
        ...shorthands.borderRadius('4px'),
        width: '48px',
        height: '48px',
    },

    text: {
        ...shorthands.margin(0),
    },
});

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
            iconProps: { iconName: 'FabricUserFolder' },
            // iconImage: () => <FolderIcon />,
            iconImage: () => <img className={styles.logo} src="/assets/icons/folders.svg" alt="" />,
        },
        {
            key: IDataSourceType.DEMO,
            text: demoText,
            iconProps: { iconName: 'FileTemplate' },
            iconImage: () => <img className={styles.logo} src="/assets/icons/joystick.svg" alt="" />,
        },
        // {
        //     key: IDataSourceType.CLOUD,
        //     text: intl.get(`dataSource.importData.type.${IDataSourceType.CLOUD}`),
        //     iconProps: { iconName: 'CloudDownload' },
        //     iconImage: () => <img className={styles.logo} src="/assets/icons/cloud-folder.svg" alt="" />,
        // },
        {
            key: IDataSourceType.DATABASE,
            text: dbText,
            iconProps: { iconName: 'Database' },
            iconImage: () => <img className={styles.logo} src="/assets/icons/data-server.svg" alt="" />,
        },
        {
            key: IDataSourceType.AIRTABLE,
            text: 'AirTable',
            iconProps: { iconName: 'Table' },
            iconImage: () => <img className={styles.logo} src="/assets/icons/airtable.svg" alt="" />,
            disabled: false,
        },
        {
            key: IDataSourceType.RESTFUL,
            text: restfulText,
            iconProps: { iconName: 'Cloud' },
            iconImage: () => <img className={styles.logo} src="/assets/icons/cloud-computing.svg" alt="" />,
        },
        // {
        //     key: IDataSourceType.OLAP,
        //     text: 'OLAP',
        //     iconProps: { iconName: 'TripleColumn' },
        //     iconImage: () => <img className={styles.logo} src="/assets/icons/cloud-computing_1.svg" alt="" />,
        //     disabled: true,
        // },
    ];
    const styles = useStyles();

    return (
        <div className={styles.main}>
            {/* <CardGrid>
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
            </CardGrid> */}
            {options.map((op) => (
                <Card
                    key={op.key}
                    {...props}
                    className={styles.card}
                    onClick={() => {
                        if (!op.disabled) {
                            onSelected(op.key);
                        }
                    }}
                >
                    <CardHeader
                        image={op.iconImage && op.iconImage()}
                        header={<Text weight="semibold">{op.text}</Text>}
                        description={<Caption1 className={styles.caption}>Developer</Caption1>}
                        action={<Button appearance="transparent" icon={<MoreHorizontal />} aria-label="More options" />}
                    />

                    <p className={styles.text}>{intl.get(`dataSource.importData.sources.${op.key}.desc`)}</p>
                </Card>
            ))}
        </div>
    );
};

export default SupportedSources;
