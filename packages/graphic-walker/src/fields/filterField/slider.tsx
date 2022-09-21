import React from 'react';
import styled from 'styled-components';
import { filter, fromEvent, map, throttleTime } from 'rxjs';


const SliderContainer = styled.div({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'stretch',
    overflow: 'hidden',
    paddingBlock: '1em',

    '> .output': {
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'stretch',
        justifyContent: 'space-between',

        '> output': {
            userSelect: 'none',
            minWidth: '4em',
            paddingInline: '0.5em',
            textAlign: 'center',
        },
    },
});

const SliderElement = styled.div({
    marginInline: '1em',
    paddingBlock: '10px',
    flexGrow: 1,
    flexShrink: 1,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'stretch',
});

const SliderTrack = styled.div({
    flexGrow: 1,
    flexShrink: 1,
    backgroundColor: '#ccc',
    border: '1px solid #aaa',
    height: '10px',
    borderRadius: '5px',
    position: 'relative',
});

const SliderThumb = styled.div({
    position: 'absolute',
    top: '50%',
    cursor: 'ew-resize',
    backgroundColor: '#e2e2e2',
    backgroundImage: `
        linear-gradient(#666, #666 4%, transparent 4%, transparent 96%, #666 95%),
        linear-gradient(90deg, #666, #666 10%, transparent 10%, transparent 90%, #666 90%)
    `,
    width: '10px',
    height: '20px',
    borderRadius: '2px',
    outline: 'none',

    ':hover': {
        backgroundColor: '#fff',
    },
});

const SliderSlice = styled.div({
    backgroundColor: '#fff',
    position: 'absolute',
    height: '100%',
    borderRadius: '5px',

    ':hover': {
        backgroundColor: '#fff',
    },
});


const nicer = (range: readonly [number, number], value: number): string => {
    const precision = /(\.\d*)$/.exec(((range[1] - range[0]) / 1000).toString())![0].length;
    
    return value.toFixed(precision).replace(/\.?0+$/, '');
};

interface SliderProps {
    min: number;
    max: number;
    value: readonly [number, number];
    onChange: (value: readonly [number, number]) => void;
    isDateTime?: boolean;
}

const Slider: React.FC<SliderProps> = React.memo(function Slider ({
    min,
    max,
    value,
    onChange,
    isDateTime = false,
}) {
    const [dragging, setDragging] = React.useState<'left' | 'right' | null>(null);
    const trackRef = React.useRef<HTMLDivElement | null>(null);
    const sliceRef = React.useRef<HTMLDivElement | null>(null);

    const range: typeof value = [
        (value[0] - min) / ((max - min) || 1),
        (value[1] - min) / ((max - min) || 1)
    ];

    const mouseOffsetRef = React.useRef(0);

    React.useEffect(() => {
        if (dragging) {
            const stop = (ev?: MouseEvent) => {
                setDragging(null);
                ev?.stopPropagation();
            };

            const dragHandler = fromEvent(document.body, 'mousemove').pipe(
                throttleTime(100),
                map(ev => {
                    if (!trackRef.current || !dragging) {
                        return null;
                    }

                    if ((ev as MouseEvent).buttons !== 1) {
                        stop();

                        return null;
                    }

                    const { x, width } = trackRef.current.getBoundingClientRect();

                    const pos = Math.min(
                        dragging === 'left' ? range[1] : 1,
                        Math.max(
                            dragging === 'right' ? range[0] : 0,
                            ((ev as MouseEvent).clientX - mouseOffsetRef.current - x) / width
                        )
                    );

                    return pos;
                }),
                filter(pos => {
                    return pos !== null && pos !== range[dragging === 'left' ? 0 : 1];
                }),
            ).subscribe(pos => {
                const next: [number, number] = [...range];
                next[dragging === 'left' ? 0 : 1] = pos as number;

                next[0] = next[0] * ((max - min) || 1) + min;
                next[1] = next[1] * ((max - min) || 1) + min;

                onChange(next);
            });
            
            document.body.addEventListener('mouseup', stop);
            
            return () => {
                document.body.removeEventListener('mouseup', stop);
                dragHandler.unsubscribe();
            };
        }
    }, [dragging, range, onChange, min, max]);

    return (
        <SliderContainer>
            <div className="output">
                <output htmlFor="slider:min">
                    {isDateTime ? `${new Date(value[0])}` : nicer([min, max], value[0])}
                </output>
                <output htmlFor="slider:max">
                    {isDateTime ? `${new Date(value[1])}` : nicer([min, max], value[1])}
                </output>
            </div>
            <SliderElement>
                <SliderTrack
                    ref={e => trackRef.current = e}
                >
                    <SliderSlice
                        role="presentation"
                        ref={e => sliceRef.current = e}
                        style={{
                            left: `${range[0] * 100}%`,
                            width: `${(range[1] - range[0]) * 100}%`,
                        }}
                    />
                    <SliderThumb
                        role="slider"
                        aria-label="minimum"
                        id="slider:min"
                        aria-valuemin={min}
                        aria-valuemax={max}
                        aria-valuenow={value[0]}
                        aria-valuetext={isDateTime ? `${new Date(value[0])}` : nicer([min, max], value[0])}
                        tabIndex={-1}
                        onMouseDown={ev => {
                            if (ev.buttons === 1) {
                                mouseOffsetRef.current = ev.nativeEvent.offsetX;
                                setDragging('left');
                            }
                        }}
                        style={{
                            left: `${range[0] * 100}%`,
                            transform: 'translate(-100%, -50%)',
                        }}
                    />
                    <SliderThumb
                        role="slider"
                        aria-label="maximum"
                        id="slider:max"
                        aria-valuemin={min}
                        aria-valuemax={max}
                        aria-valuenow={value[1]}
                        aria-valuetext={isDateTime ? `${new Date(value[1])}` : nicer([min, max], value[1])}
                        tabIndex={-1}
                        onMouseDown={ev => {
                            if (ev.buttons === 1) {
                                mouseOffsetRef.current = ev.nativeEvent.offsetX;
                                setDragging('right');
                            }
                        }}
                        style={{
                            left: `${range[1] * 100}%`,
                            transform: 'translate(0, -50%)',
                        }}
                    />
                </SliderTrack>
            </SliderElement>
        </SliderContainer>
    );
});


export default Slider;
