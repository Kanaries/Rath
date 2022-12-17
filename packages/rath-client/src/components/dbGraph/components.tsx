import styled from 'styled-components';
import { BOX_HEIGHT, BOX_WIDTH } from './config';

export const DBBox = styled.span`
    user-select: none;
    width: ${BOX_WIDTH}px;
    height: ${BOX_HEIGHT}px;
    padding: 0 0.5em;
    overflow: hidden;
    text-overflow: ellipsis;
    background-color: #fff;
    border: 1px solid #cfcfcf;
    border-radius: 2px;
    text-align: center;
    line-height: ${BOX_HEIGHT - 2}px;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    &:hover {
        background-color: #f3f3f3;
    }
`;

export const ListContainer = styled.div({
    flexGrow: 1,
    flexShrink: 1,
    overflow: 'hidden scroll',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '10em',
    borderRight: '1px solid #cfcfcf',
    '> *': {
        flexGrow: 0,
        flexShrink: 0,
        margin: '0.4em 0',
    },
});
export const DiagramContainer = styled.div({
    flexGrow: 1,
    flexShrink: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'row',
    position: 'relative',
    boxSizing: 'border-box',
    '> *': {
        flexGrow: 0,
        flexShrink: 0,
    },
});