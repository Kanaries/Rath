import { Icon } from '@fluentui/react';
import databaseOptions from '../config';


export const renderDropdownTitle: React.FC<typeof databaseOptions | undefined> = ([item]) => {
    if (!item) {
        return null;
    }

    const { icon, text, key } = item;

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-start',
            }}
        >
            <Icon
                iconName={icon ? key : 'database'}
                role="presentation"
                aria-hidden
                title={text}
                style={{
                    lineHeight: '20px',
                    width: '20px',
                    height: '20px',
                    textAlign: 'center',
                    marginInlineEnd: '8px',
                    overflow: 'hidden',
                }}
            />
            <span style={{ flexGrow: 1 }}>
                {text}
            </span>
        </div>
    );
};

export const renderDropdownItem: React.FC<typeof databaseOptions[0] | undefined> = props => {
    if (!props) {
        return null;
    }

    const { icon, text, key } = props;

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-start',
            }}
        >
            <Icon
                iconName={icon ? key : 'database'}
                role="presentation"
                aria-hidden
                title={text}
                style={{
                    width: '20px',
                    height: '20px',
                    textAlign: 'center',
                    marginInlineEnd: '8px',
                    overflow: 'hidden',
                }}
            />
            <span style={{ flexGrow: 1 }}>
                {text}
            </span>
        </div>
    );
};