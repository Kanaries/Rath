import { Slider } from '@fluentui/react';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

interface RangeSelectionProps {
    range: [number, number];
    left: number;
    right: number;
    rangeType?: string;
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
        border: 1px solid gray;
        border-radius: 2px;
    }
    .line {
        margin: 0 10px;
    }
`;

const RangeSelection: React.FC<RangeSelectionProps> = (props) => {
    const { range, left, right, rangeType, onValueChange } = props;
    const [dateTimePick, setDateTimePick] = useState<[number, number]>([
        rangeType === 'temporal' && left > range[1] ? left : -1,
        rangeType === 'temporal' && right > range[1] ? right : -1,
    ]);

    let start;
    let end;

    if (rangeType === 'temporal') {
        if (left <= range[1] && right <= range[1]) {
            start = undefined;
            end = undefined;
        } else {
            start = new Date(left + 8 * 60 * 60 * 1000).toISOString().slice(0, -1);
            end = new Date(right + 8 * 60 * 60 * 1000).toISOString().slice(0, -1);
        }
    } else {
        if (left <= range[1] && right <= range[1]) {
            start = left;
            end = right;
        } else {
            start = range[0];
            end = range[1];
        }
    }

    useEffect(() => {
        const result = dateTimePick.every((item) => item !== -1);
        result && onValueChange(dateTimePick);
    }, [dateTimePick]);

    return (
        <RangeSelectionDiv>
            {rangeType === 'temporal' ? (
                <div className="calendar">
                    <input
                        className="data-time"
                        type="datetime-local"
                        value={start}
                        onChange={(e) => {
                            const newDateTime: [number, number] = [...dateTimePick];
                            const startDateTime = new Date(e.target.value).getTime();
                            if (newDateTime[1] !== -1 && startDateTime > newDateTime[1]) {
                                newDateTime[0] = newDateTime[1];
                            } else {
                                newDateTime[0] = startDateTime;
                            }
                            setDateTimePick(newDateTime);
                        }}
                    />
                    <span className="line">——</span>
                    <input
                        className="data-time"
                        type="datetime-local"
                        value={end}
                        onChange={(e) => {
                            console.log(e.target.value)
                            const newDateTime: [number, number] = [...dateTimePick];
                            const endDateTime = new Date(e.target.value).getTime();
                            if (newDateTime[0] !== -1 && endDateTime < newDateTime[0]) {
                                newDateTime[1] = newDateTime[0];
                            } else {
                                newDateTime[1] = endDateTime;
                            }
                            setDateTimePick(newDateTime);
                        }}
                    />
                </div>
            ) : (
                <Slider
                    label="range"
                    min={range[0]}
                    max={range[1]}
                    value={typeof end !== 'number' ? range[1] : end}
                    lowerValue={typeof start !== 'number' ? range[0] : start}
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
