import { Fragment, memo } from "react";
import styled from "styled-components";
import type { IDBEdge, IDBNode } from './localTypes';
import { BOX_HEIGHT, BOX_WIDTH, encodePath } from ".";


const OPTION_WIDTH = 60;
const OPTION_HEIGHT = 15;

const Select = styled.g({
    fontSize: '10px',

    '& rect': {
        opacity: 0.88,
    },
    '& text': {
        fontSize: '10px',
        lineHeight: '1em',
        transform: `translate(${OPTION_WIDTH / 2}px, calc(0.9em + (${OPTION_HEIGHT}px - 1em) / 2))`,
        pointerEvents: 'none',
        userSelect: 'none',
    },
    '> .option': {
        display: 'none',
        cursor: 'pointer',
        '&.type:hover': {
            fill: '#d8d8d8',
        },
    },
    ':hover > .option': {
        display: 'unset',
    },
});

export interface LinkProps {
    from: IDBNode;
    fromCols: string[];
    fromCol: string;
    to: IDBNode;
    toCols: string[];
    toCol: string;
    type: IDBEdge['type'];
    setType: (type: IDBEdge['type']) => void;
    deleteLink: () => void;
    reverse: () => void;
    setFromCol: (col: string) => void;
    setToCol: (col: string) => void;
}

const Link = memo<LinkProps>(function Link({
    from, fromCols, fromCol, to, toCols, toCol, type, setType, deleteLink, reverse, setFromCol, setToCol,
}) {
    return (
        <>
            <path
                d={encodePath(
                    from.x + BOX_WIDTH / 2,
                    from.y + BOX_HEIGHT / 2,
                    to.x + BOX_WIDTH / 2,
                    to.y + BOX_HEIGHT / 2,
                )}
            />
            <Select style={{ transform: `translateX(${-1 * OPTION_WIDTH}px)` }}>
                <rect
                    x={(from.x + to.x) / 2 + BOX_WIDTH / 2 - OPTION_WIDTH / 2}
                    y={(from.y + to.y) / 2 + BOX_HEIGHT / 2 - OPTION_HEIGHT / 2}
                    width={OPTION_WIDTH}
                    height={OPTION_HEIGHT}
                    fill="#fff"
                    stroke="#0027b4"
                    strokeWidth="1"
                />
                <text
                    x={(from.x + to.x) / 2 + BOX_WIDTH / 2 - OPTION_WIDTH / 2}
                    y={(from.y + to.y) / 2 + BOX_HEIGHT / 2 - OPTION_HEIGHT / 2}
                    textAnchor="middle"
                    stroke="none"
                    fill="#0027b4"
                >
                    {fromCol}
                </text>
                {fromCols.map((col, i) => (
                    <Fragment key={i}>
                        <rect
                            className="option type"
                            x={(from.x + to.x) / 2 + BOX_WIDTH / 2 - OPTION_WIDTH / 2}
                            y={(from.y + to.y) / 2 + BOX_HEIGHT / 2 - OPTION_HEIGHT / 2 + (i + 1) * OPTION_HEIGHT + 1}
                            width={OPTION_WIDTH}
                            height={OPTION_HEIGHT}
                            fill="#fff"
                            stroke="#888"
                            strokeWidth="1"
                            onClick={e => {
                                e.stopPropagation();
                                setFromCol(col);
                            }}
                        />
                        <text
                            className="option"
                            x={(from.x + to.x) / 2 + BOX_WIDTH / 2 - OPTION_WIDTH / 2}
                            y={(from.y + to.y) / 2 + BOX_HEIGHT / 2 - OPTION_HEIGHT / 2 + (i + 1) * OPTION_HEIGHT + 1}
                            textAnchor="middle"
                            stroke="none"
                            fill="currentColor"
                        >
                            {col}
                        </text>
                    </Fragment>
                ))}
            </Select>
            <Select>
                <rect
                    x={(from.x + to.x) / 2 + BOX_WIDTH / 2 - OPTION_WIDTH / 2}
                    y={(from.y + to.y) / 2 + BOX_HEIGHT / 2 - OPTION_HEIGHT / 2}
                    width={OPTION_WIDTH}
                    height={OPTION_HEIGHT}
                    fill="#fff"
                    stroke="#0027b4"
                    strokeWidth="1"
                />
                <text
                    x={(from.x + to.x) / 2 + BOX_WIDTH / 2 - OPTION_WIDTH / 2}
                    y={(from.y + to.y) / 2 + BOX_HEIGHT / 2 - OPTION_HEIGHT / 2}
                    textAnchor="middle"
                    stroke="none"
                    fill="#0027b4"
                >
                    {type}
                </text>
                <rect
                    className="option"
                    x={(from.x + to.x) / 2 + BOX_WIDTH / 2 - OPTION_WIDTH / 2}
                    y={(from.y + to.y) / 2 + BOX_HEIGHT / 2 - OPTION_HEIGHT / 2 - OPTION_HEIGHT * 2}
                    width={OPTION_WIDTH}
                    height={OPTION_HEIGHT}
                    fill="#f22"
                    stroke="#f22"
                    strokeWidth="1"
                    onClick={() => {
                        deleteLink();
                    }}
                />
                <text
                    className="option"
                    x={(from.x + to.x) / 2 + BOX_WIDTH / 2 - OPTION_WIDTH / 2}
                    y={(from.y + to.y) / 2 + BOX_HEIGHT / 2 - OPTION_HEIGHT / 2 - OPTION_HEIGHT * 2}
                    textAnchor="middle"
                    stroke="none"
                    fill="#fff"
                >
                    {'x'}
                </text>
                <rect
                    className="option"
                    x={(from.x + to.x) / 2 + BOX_WIDTH / 2 - OPTION_WIDTH / 2}
                    y={(from.y + to.y) / 2 + BOX_HEIGHT / 2 - OPTION_HEIGHT / 2 - OPTION_HEIGHT}
                    width={OPTION_WIDTH}
                    height={OPTION_HEIGHT}
                    fill="#0027b4"
                    stroke="#0027b4"
                    strokeWidth="1"
                    onClick={() => {
                        reverse();
                    }}
                />
                <text
                    className="option"
                    x={(from.x + to.x) / 2 + BOX_WIDTH / 2 - OPTION_WIDTH / 2}
                    y={(from.y + to.y) / 2 + BOX_HEIGHT / 2 - OPTION_HEIGHT / 2 - OPTION_HEIGHT}
                    textAnchor="middle"
                    stroke="none"
                    fill="#fff"
                >
                    {'⇋'}
                </text>
                {new Array<typeof type>('LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'FULL JOIN').filter(
                    t => t !== type
                ).map((t, i) => (
                    <Fragment key={t}>
                        <rect
                            className="option type"
                            x={(from.x + to.x) / 2 + BOX_WIDTH / 2 - OPTION_WIDTH / 2}
                            y={(from.y + to.y) / 2 + BOX_HEIGHT / 2 - OPTION_HEIGHT / 2 + (i + 1) * OPTION_HEIGHT + 1}
                            width={OPTION_WIDTH}
                            height={OPTION_HEIGHT}
                            fill="#fff"
                            stroke="#888"
                            strokeWidth="1"
                            onClick={e => {
                                e.stopPropagation();
                                if (t !== type) {
                                    setType(t);
                                }
                            }}
                        />
                        <text
                            className="option"
                            x={(from.x + to.x) / 2 + BOX_WIDTH / 2 - OPTION_WIDTH / 2}
                            y={(from.y + to.y) / 2 + BOX_HEIGHT / 2 - OPTION_HEIGHT / 2 + (i + 1) * OPTION_HEIGHT + 1}
                            textAnchor="middle"
                            stroke="none"
                            fill="currentColor"
                        >
                            {t}
                        </text>
                    </Fragment>
                ))}
            </Select>
            <Select style={{ transform: `translateX(${OPTION_WIDTH}px)` }}>
                <rect
                    x={(from.x + to.x) / 2 + BOX_WIDTH / 2 - OPTION_WIDTH / 2}
                    y={(from.y + to.y) / 2 + BOX_HEIGHT / 2 - OPTION_HEIGHT / 2}
                    width={OPTION_WIDTH}
                    height={OPTION_HEIGHT}
                    fill="#fff"
                    stroke="#0027b4"
                    strokeWidth="1"
                />
                <text
                    x={(from.x + to.x) / 2 + BOX_WIDTH / 2 - OPTION_WIDTH / 2}
                    y={(from.y + to.y) / 2 + BOX_HEIGHT / 2 - OPTION_HEIGHT / 2}
                    textAnchor="middle"
                    stroke="none"
                    fill="#0027b4"
                >
                    {toCol}
                </text>
                {toCols.map((col, i) => (
                    <Fragment key={i}>
                        <rect
                            className="option type"
                            x={(from.x + to.x) / 2 + BOX_WIDTH / 2 - OPTION_WIDTH / 2}
                            y={(from.y + to.y) / 2 + BOX_HEIGHT / 2 - OPTION_HEIGHT / 2 + (i + 1) * OPTION_HEIGHT + 1}
                            width={OPTION_WIDTH}
                            height={OPTION_HEIGHT}
                            fill="#fff"
                            stroke="#888"
                            strokeWidth="1"
                            onClick={e => {
                                e.stopPropagation();
                                setToCol(col);
                            }}
                        />
                        <text
                            className="option"
                            x={(from.x + to.x) / 2 + BOX_WIDTH / 2 - OPTION_WIDTH / 2}
                            y={(from.y + to.y) / 2 + BOX_HEIGHT / 2 - OPTION_HEIGHT / 2 + (i + 1) * OPTION_HEIGHT + 1}
                            textAnchor="middle"
                            stroke="none"
                            fill="currentColor"
                        >
                            {col}
                        </text>
                    </Fragment>
                ))}
            </Select>
        </>
    );
});


export default Link;
