import { Fragment, memo, useMemo } from "react";
import styled from "styled-components";
import type { IDBEdge } from './localTypes';
import { encodePath } from "./utils";
import { BOX_HEIGHT, BOX_WIDTH } from "./config";


const OPTION_WIDTH = 60;
const OPTION_HEIGHT = 15;

const Select = styled.g`
    font-size: 10px;

    & rect {
        opacity: 0.88;
    }
    & text {
        font-size: 10px;
        line-height: 1em;
        transform: ${() => `translate(${OPTION_WIDTH / 2}px, calc(0.9em + (${OPTION_HEIGHT}px - 1em) / 2))`};
        pointer-events: none;
        user-select: none;
    }
    > .option {
        display: none;
        cursor: pointer;
        &.type:hover {
            fill: #d8d8d8;
        }
    }
    :hover > .option {
        display: unset;
    }
`;

export interface LinkNode {
    readonly layout: {
        readonly x: number;
        readonly y: number;
    };
    readonly allCols: readonly string[];
    readonly colIdx: number;
    readonly setColIdx: (index: number) => void;
}

export interface LinkProps {
    from: LinkNode;
    to: LinkNode;
    joinOpt: IDBEdge['joinOpt'];
    setJoinOpt: (opt: IDBEdge['joinOpt']) => void;
    deleteLink: () => void;
    reverse: () => void;
}

interface SVGDropdownProps<T extends string> {
    cx: number;
    cy: number;
    dx?: number;
    options: readonly T[];
    curIdx: number;
    onChange: (index: number) => void;
    actions?: readonly {
        readonly text: string;
        readonly action: () => void;
        readonly color?: string;
    }[];
}

const SVGDropdown = <T extends string = string>({ cx, cy, dx = 0, options, curIdx, onChange, actions = [] }: SVGDropdownProps<T>) => {
    const x = cx - OPTION_WIDTH / 2;
    const y = cy - OPTION_HEIGHT / 2;

    return (
        <Select style={{ transform: dx ? `translateX(${dx * OPTION_WIDTH}px)` : undefined }}>
            <rect
                x={x}
                y={y}
                width={OPTION_WIDTH}
                height={OPTION_HEIGHT}
                fill="#fff"
                stroke="#0027b4"
                strokeWidth="1"
            />
            <text
                x={x}
                y={y}
                textAnchor="middle"
                stroke="none"
                fill="#0027b4"
            >
                {options[curIdx]}
            </text>
            {options.map((option, i) => (
                <Fragment key={i}>
                    <rect
                        className="option type"
                        x={x}
                        y={y + (i + 1) * OPTION_HEIGHT + 1}
                        width={OPTION_WIDTH}
                        height={OPTION_HEIGHT}
                        fill="#fff"
                        stroke="#888"
                        strokeWidth="1"
                        onClick={e => {
                            e.stopPropagation();
                            if (i !== curIdx) {
                                onChange(i);
                            }
                        }}
                    />
                    <text
                        className="option"
                        x={x}
                        y={y + (i + 1) * OPTION_HEIGHT + 1}
                        textAnchor="middle"
                        stroke="none"
                        fill="currentColor"
                    >
                        {option}
                    </text>
                </Fragment>
            ))}
            {actions.map((action, i) => (
                <Fragment key={`action:${i}`}>
                    <rect
                        className="option"
                        x={x}
                        y={y - (i + 1) * OPTION_HEIGHT}
                        width={OPTION_WIDTH}
                        height={OPTION_HEIGHT}
                        fill={action.color ?? "#0027b4"}
                        stroke={action.color ?? "#0027b4"}
                        strokeWidth="1"
                        onClick={action.action}
                    />
                    <text
                        className="option"
                        x={x}
                        y={y - (i + 1) * OPTION_HEIGHT}
                        textAnchor="middle"
                        stroke="none"
                        fill="#fff"
                    >
                        {action.text}
                    </text>
                </Fragment>
            ))}
        </Select>
    );
};

const allJoinTypes: Readonly<Array<IDBEdge['joinOpt']>> = ['LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'FULL JOIN'];

const Link = memo<LinkProps>(function Link({
    from, to, joinOpt, setJoinOpt, deleteLink, reverse,
}) {
    const path = useMemo(() => encodePath(
        from.layout.x + BOX_WIDTH / 2,
        from.layout.y + BOX_HEIGHT / 2,
        to.layout.x + BOX_WIDTH / 2,
        to.layout.y + BOX_HEIGHT / 2,
    ), [from.layout, to.layout]);

    const cx = useMemo(() => (from.layout.x + to.layout.x) / 2 + BOX_WIDTH / 2, [from.layout.x, to.layout.x]);
    const cy = useMemo(() => (from.layout.y + to.layout.y) / 2 + BOX_HEIGHT / 2, [from.layout.y, to.layout.y]);

    return (
        <>
            <path d={path} />
            <SVGDropdown
                cx={cx}
                cy={cy}
                dx={-1}
                options={from.allCols}
                curIdx={from.colIdx}
                onChange={idx => from.setColIdx(idx)}
            />
            <SVGDropdown<typeof joinOpt>
                cx={cx}
                cy={cy}
                dx={0}
                options={allJoinTypes}
                curIdx={allJoinTypes.findIndex(opt => opt === joinOpt)}
                onChange={idx => setJoinOpt(allJoinTypes[idx])}
                actions={[
                    {
                        text: 'x',
                        action: deleteLink,
                        color: '#f22',
                    },
                    {
                        text: '⇋',
                        action: reverse,
                    },
                ]}
            />
            <SVGDropdown
                cx={cx}
                cy={cy}
                dx={1}
                options={to.allCols}
                curIdx={to.colIdx}
                onChange={idx => to.setColIdx(idx)}
            />
        </>
    );
});


export default Link;
