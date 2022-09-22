import styled from 'styled-components';

/**
 * react-beautiful-dnd v13.1.0 bug
 * https://github.com/atlassian/react-beautiful-dnd/issues/2361
 */
export const FieldPill = styled.div<{isDragging: boolean}>`
    transform: ${props => !props.isDragging && 'translate(0px, 0px) !important'};
    user-select: none;
`