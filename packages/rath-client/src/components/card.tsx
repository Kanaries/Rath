import styled from 'styled-components';

interface CardProps {
    backgroundColor?: string;
    fitContainer?: boolean;
    stretchChildren?: boolean;
}
export const Card = styled.div<CardProps>`
    background-color: ${(props) => props.backgroundColor || '#fff'};
    flex-grow: ${({ fitContainer }) => fitContainer ? 1 : 'unset'};
    flex-shrink: ${({ fitContainer }) => fitContainer ? 1 : 'unset'};
    height: ${({ fitContainer }) => fitContainer ? '100%' : 'unset'};
    display: ${({ stretchChildren }) => stretchChildren ? 'flex' : 'block'};
    flex-direction: ${({ stretchChildren }) => stretchChildren ? 'column' : 'unset'};
    > * {
        flex-grow: ${({ stretchChildren }) => stretchChildren ? 1 : 'unset'};
        flex-shrink: ${({ stretchChildren }) => stretchChildren ? 0 : 'unset'};
    }
    padding: 1.5em;
    border-radius: 2px;
    /* box-shadow: 0 1.6px 7.6px 0 rgba(0, 0, 0, 0.1), 0 0.3px 1.9px 0 rgba(0, 0, 0, 0.08); */
    border: 1px solid #e9ebf0;
    margin-bottom: 28px;
    animation-duration: 0.5s;
    animation-name: showCard;
    @keyframes showCard {
        from {
            transform: scaleY(0);
        }
        end {
            transform: scaleY(1);
        }
    }
`;
