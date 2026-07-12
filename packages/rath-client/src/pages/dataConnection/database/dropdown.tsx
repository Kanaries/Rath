import styled from 'styled-components';
import { DatabaseBrandIcon, RathIcon } from '../../../components/icons';
import databaseOptions from './options';


type DatabaseOption = typeof databaseOptions[number];

const ItemContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
`;

const StyledIcon = styled.span`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 20px;
    width: 20px;
    height: 20px;
    text-align: center;
    margin-inline-end: 8px;
    overflow: hidden;
`;

export const renderDropdownTitle = (items?: DatabaseOption[]) => {
    const [item] = items ?? [];

    if (!item) {
        return null;
    }

    const { icon, text } = item;

    return (
        <ItemContainer>
            <StyledIcon title={text}>
                {icon ? <DatabaseBrandIcon icon={icon} label={text} /> : <RathIcon name="database" />}
            </StyledIcon>
            <span style={{ flexGrow: 1 }}>
                {text}
            </span>
        </ItemContainer>
    );
};

export const renderDropdownItem = (props?: DatabaseOption) => {
    if (!props) {
        return null;
    }

    const { icon, text } = props;

    return (
        <ItemContainer>
            <StyledIcon title={text}>
                {icon ? <DatabaseBrandIcon icon={icon} label={text} /> : <RathIcon name="database" />}
            </StyledIcon>
            <span style={{ flexGrow: 1 }}>
                {text}
            </span>
        </ItemContainer>
    );
};
