import intl from 'react-intl-universal';
import { Slider } from '@fluentui/react';
import React, { useCallback } from 'react';

interface RangeSelectionProps {
    range: [number, number];
    left: number;
    right: number;
    onValueChange: (range: [number, number]) => void;
    type: 'number' | 'time';
}

const DateTimeValueLabelStyle = {
    // monospace
    fontFamily: 'Courier New',
    // narrowed
    letterSpacing: '-0.05em',
    transform: 'scaleX(0.95)',
    marginInline: '-1%',
} as const;

const RangeSelection: React.FC<RangeSelectionProps> = (props) => {
    const { range, left, right, onValueChange, type } = props;

    const formatter = useCallback((v: number) => {
        if (type === 'time') {
            return intl.get('date_format', {
                Y: `${new Date(v).getFullYear()}`.padStart(4, ' '),
                m: intl.get(`time_format.shortMonths.${new Date(v).getDay()}`),
                d: `${new Date(v).getDate()}`.padStart(2, '0'),
                w: intl.get(`time_format.shortDays.${new Date(v).getDay()}`),
                H: `${new Date(v).getHours()}`.padStart(2, '0'),
                M: `${new Date(v).getMinutes()}`.padStart(2, '0'),
                S: `${new Date(v).getSeconds()}`.padStart(2, '0'),
            });
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
                    minWidth: '120px',
                },
                valueLabel: {
                    minWidth: '40px',
                    width: 'unset',
                    ...(type === 'time' ? DateTimeValueLabelStyle : {}),
                },
            }}
        />
    );
};

export default RangeSelection;
