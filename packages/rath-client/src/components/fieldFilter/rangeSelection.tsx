import intl from 'react-intl-universal';
import React, { useCallback } from 'react';
import styled from 'styled-components';
import { Slider } from '../ui/slider';

interface RangeSelectionProps {
    range: [number, number];
    left: number;
    right: number;
    onValueChange: (range: [number, number]) => void;
    type: 'number' | 'time';
}

const Container = styled.div<{ isTime: boolean }>`
    flex: 1;
    display: grid;
    grid-template-columns: minmax(40px, max-content) minmax(120px, 1fr) minmax(40px, max-content);
    align-items: center;
    gap: 8px;

    > output {
        min-width: 40px;
        font-family: ${({ isTime }) => isTime ? "'Courier New', monospace" : 'inherit'};
        font-size: 12px;
        line-height: 1.2;
        white-space: nowrap;
    }
`;

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
        <Container isTime={type === 'time'}>
            <output aria-label="range start">{formatter(left)}</output>
            <Slider
                min={range[0]}
                max={range[1]}
                value={[left, right]}
                thumbLabels={[intl.get('dataSource.filter.range') + ' start', intl.get('dataSource.filter.range') + ' end']}
                onValueChange={(next) => {
                    if (next.length >= 2) {
                        onValueChange([next[0], next[1]]);
                    }
                }}
            />
            <output aria-label="range end">{formatter(right)}</output>
        </Container>
    );
};

export default RangeSelection;
