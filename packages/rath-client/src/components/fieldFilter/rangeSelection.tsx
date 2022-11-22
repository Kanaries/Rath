import React from 'react';
import { Slider } from '@fluentui/react';
import styled from 'styled-components';

interface RangeSelectionProps {
    range: [number, number];
    left: number;
    right: number;
    filterType?: string;
    onValueChange: (range: [number, number]) => void;
}

const RangeSelectionDiv = styled.div`
    display: flex;
    overflow: hidden;
    align-items: center;
    .calendar {
        margin: 10px 0;
    }
    .data-time {
        width: 150px;
        border: 1px solid gray;
        border-radius: 2px;
    }
    .line {
        margin: 0 10px;
    }
`;

const RangeSelection: React.FC<RangeSelectionProps> = (props) => {
    const { range, left, right, filterType, onValueChange } = props;
    const min = new Date(new Date(range[0].toString()).getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, -5);
    const max = new Date(new Date(range[1].toString()).getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, -5);
    const lowValue = new Date(
        new Date(left.toString().length > 4 ? left : left.toString()).getTime() + 8 * 60 * 60 * 1000
    )
        .toISOString()
        .slice(0, -5);
    const higValue = new Date(
        new Date(right.toString().length > 4 ? right : right.toString()).getTime() + 8 * 60 * 60 * 1000
    )
        .toISOString()
        .slice(0, -5);

    return (
        <RangeSelectionDiv>
            {filterType === 'temporal' ? (
                <div className="calendar">
                    <input
                        className="data-time"
                        type="datetime-local"
                        value={lowValue}
                        min={min}
                        max={higValue}
                        onChange={(e) => {
                            const startDateTime = new Date(e.target.value).getTime();
                            onValueChange([
                                startDateTime,
                                right.toString.length > 4 ? right : new Date(right).getTime(),
                            ]);
                        }}
                    />
                    <span className="line">——</span>
                    <input
                        className="data-time"
                        type="datetime-local"
                        value={higValue}
                        min={lowValue}
                        max={max}
                        onChange={(e) => {
                            const endDateTime = new Date(e.target.value).getTime();
                            onValueChange([left.toString.length > 4 ? left : new Date(left).getTime(), endDateTime]);
                        }}
                    />
                </div>
            ) : (
                <Slider
                    label="range"
                    min={range[0]}
                    max={range[1]}
                    value={right}
                    lowerValue={left}
                    ranged
                    onChange={(_v, r) => {
                        r && onValueChange(r);
                    }}
                    styles={{
                        root: {
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'stretch',
                        },
                        container: {
                            display: 'flex',
                        },
                        slideBox: {
                            flex: 1,
                        },
                        valueLabel: {
                            minWidth: '40px',
                            width: 'unset',
                        },
                    }}
                />
            )}
        </RangeSelectionDiv>
    );
};

export default RangeSelection;
