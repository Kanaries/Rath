import { Icon } from '@fluentui/react';
import styled from 'styled-components';
import databaseOptions from './options';


const ItemContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
`;

const StyledIcon = styled(Icon)`
    line-height: 20px;
    width: 20px;
    height: 20px;
    text-align: center;
    margin-inline-end: 8px;
    overflow: hidden;
`;

export const renderDropdownTitle: React.FC<typeof databaseOptions | undefined> = ([item]) => {
    if (!item) {
        return null;
    }

    const { icon, text, key } = item;

    return (
        <ItemContainer>
            <StyledIcon
                iconName={icon ? key : 'database'}
                role="presentation"
                aria-hidden
                title={text}
            />
            <span style={{ flexGrow: 1 }}>
                {text}
            </span>
        </ItemContainer>
    );
};

export const renderDropdownItem: React.FC<typeof databaseOptions[0] | undefined> = props => {
    if (!props) {
        return null;
    }

    const { icon, text, key } = props;

    return (
        <ItemContainer>
            <StyledIcon
                iconName={icon ? key : 'database'}
                role="presentation"
                aria-hidden
                title={text}
            />
            <span style={{ flexGrow: 1 }}>
                {text}
            </span>
        </ItemContainer>
    );
};