import styled from 'styled-components';

interface CardProps {
    backgroundColor?: string;
}
export const Card = styled.div<CardProps>`
    background-color: ${props => props.backgroundColor || '#fff'};
    padding: 28px;
    border-radius: 2px;
    box-shadow: 0 1.6px 3.6px 0 rgba(0,0,0,0.132), 0 0.3px 0.9px 0 rgba(0,0,0,0.108);
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