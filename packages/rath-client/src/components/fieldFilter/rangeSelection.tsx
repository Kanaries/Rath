import { Slider } from '@fluentui/react';
import React, { useEffect, useMemo } from 'react';


interface RangeSelectionProps {
    values: number[];
    left: number;
    right: number;
    onValueChange: (range: [number, number]) => void;
}
const RangeSelection: React.FC<RangeSelectionProps> = props => {
    const { values, left, right, onValueChange } = props;
    
    const fieldRange = useMemo<[number, number]>(() => {
        if (values.length === 0) return [0, 0]
        let _min = Infinity;
        let _max = -Infinity;
        for (const v of values) {
            if (Number.isNaN(v)) continue;
            if (v > _max) _max = v;
            if (v < _min) _min = v;
        }
        return [_min, _max].every(Number.isFinite) ? [_min, _max] : [0, 0];
    }, [values])

    useEffect(() => {
        onValueChange(fieldRange);
    }, [fieldRange, onValueChange])

    return <div className="flex overflow-hidden items-center">
        <Slider
            label='range'
            min={fieldRange[0]}
            max={fieldRange[1]}
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
    </div>
}

export default RangeSelection;
