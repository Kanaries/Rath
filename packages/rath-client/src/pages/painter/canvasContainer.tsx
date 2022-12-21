import { observer } from "mobx-react-lite";
import { useState } from "react";
import styled from "styled-components";


const Container = styled.div`
    position: relative;
`;

const PaintTrack = styled.div`
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    pointer-events: none;
`;

const Tracker = styled.div`
    position: fixed;
    transform: translate(-50%, -50%);
    opacity: 0.33;
    border-radius: 50%;
`;

const CanvasContainer = observer<{ children: JSX.Element; size: number; color: string; showTrack: boolean; preview: boolean }>(({ children, size, color, showTrack, preview }) => {
    const [cursorPos, setCursorPos] = useState<[number, number] | null>(null);

    return (
        <Container
            onMouseOut={() => setCursorPos(null)}
            onMouseMoveCapture={e => setCursorPos([e.clientX, e.clientY])}
        >
            {children}
            {showTrack && (
                <PaintTrack>
                    {cursorPos  && (
                        <>
                            <Tracker
                                style={{
                                    backgroundColor: color,
                                    width: size,
                                    height: size,
                                    left: cursorPos[0],
                                    top: cursorPos[1],
                                }}
                            />
                            {new Array<0>(16).fill(0).map((_, i) => (
                                <Tracker
                                    style={{
                                        backgroundColor: color,
                                        opacity: 0.33 * 0.5 ** i,
                                        transition: `all ${20 * (i + 1)}ms`,
                                        width: size,
                                        height: size,
                                        left: cursorPos[0],
                                        top: cursorPos[1],
                                        backdropFilter: 'blur(20px)',
                                    }}
                                />
                            ))}
                        </>
                    )}
                    {preview && !cursorPos && (
                        <Tracker
                            style={{
                                backgroundColor: color,
                                width: size,
                                height: size,
                                left: '50%',
                                top: '40%',
                            }}
                        />
                    )}
                </PaintTrack>
            )}
        </Container>
    );
});


export default CanvasContainer;
