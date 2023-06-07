import { Slider } from '@fluentui/react';
import React, { useCallback } from 'react';

interface RangeSelectionProps {
    range: [number, number];
    left: number;
    right: number;
    onValueChange: (range: [number, number]) => void;
    type: 'number' | 'time';
}
const RangeSelection: React.FC<RangeSelectionProps> = (props) => {
    const { range, left, right, onValueChange, type } = props;

    const formatter = useCallback((v: number) => {
        if (type === 'time') {
            return new Date(v).toLocaleString();
        }
        return `${v}`;
    }, [type]);

    return (
        <Slider
            label="range"
            min={range[0]}
            max={range[1]}
            value={right}
            lowerValue={left}
            valueFormat={formatter}
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
    );
};

export default RangeSelection;
