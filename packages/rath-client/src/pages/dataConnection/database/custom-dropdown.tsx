import { Icon } from '@fluentui/react';
import datasetOptions from './config';

export const renderDropdownTitle: React.FC<typeof datasetOptions | undefined> = ([item]) => {
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
            <span style={{ flexGrow: 1 }}>{text}</span>
        </div>
    );
};

export const renderDropdownItem: React.FC<typeof datasetOptions[0] | undefined> = (props) => {
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
            <span style={{ flexGrow: 1 }}>{text}</span>
        </div>
    );
};
