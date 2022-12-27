import styled from 'styled-components';

interface CardProps {
    backgroundColor?: string;
}
export const Card = styled.div<CardProps>`
    background-color: ${props => props.backgroundColor || '#fff'};
    padding: 28px;
    border-radius: 2px;
    /* box-shadow: 0 1.6px 7.6px 0 rgba(0, 0, 0, 0.1), 0 0.3px 1.9px 0 rgba(0, 0, 0, 0.08); */
    margin-bottom: 28px;
    animation-duration: 0.5s;
    animation-name: showCard;
    @keyframes showCard {
    from {
        transform: scaleY(0);
    }
    end{
        transform: scaleY(1);
    }
    }
`