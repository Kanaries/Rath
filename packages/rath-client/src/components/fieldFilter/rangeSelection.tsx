import { Slider } from '@fluentui/react';
import React, { useEffect, useMemo } from 'react';


interface RangeSelectionProps {
    values: number[];
    left: number;
    right: number;
    onValueChange: (value: number, range: [number, number]) => void;
}
const RangeSelection: React.FC<RangeSelectionProps> = props => {
    const { values, left, right, onValueChange } = props;
    
    const fieldRange = useMemo<[number, number]>(() => {
        if (values.length === 0) return [0, 0]
        let _min = Infinity;
        let _max = -Infinity;
        for (let i = 0; i < values.length; i++) {
            if (values[i] > _max) _max = values[i];
            if (values[i] < _min) _min = values[i];
        }
        return [_min, _max]
    }, [values])

    useEffect(() => {
        onValueChange(0 ,fieldRange);
    }, [fieldRange, onValueChange])

    return <div>
        <Slider
            label='range'
            min={fieldRange[0]}
            max={fieldRange[1]}
            value={right}
            lowerValue={left}
            ranged
            onChange={(v, r) => {
                r && onValueChange(v, r);
            }}
        />
    </div>
}

export default RangeSelection;
