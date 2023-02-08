import { FC, MouseEvent, useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { DBBox } from "./components";


const PADDING = 6;

const Container = styled.div({
    position: 'absolute',
    padding: PADDING,
    transform: `translate(${-1 * PADDING}px, ${-1 * PADDING}px)`,
    overflow: 'visible',
    '> span': {
        display: 'block',
    },
});

const Button = styled.div({
    position: 'absolute',
    width: '10px',
    height: '10px',
    backgroundColor: '#fff',
    border: '1px solid #888',
    cursor: 'alias',
});

export type DBNodeProps = {
    label: string;
    layout: {
        readonly x: number;
        readonly y: number;
    };
    handleDragStart: (offset: [number, number]) => void;
    beginPath: () => void;
    readyToLink: boolean;
    isLinking: boolean;
    readyToBeLinked: boolean;
    handleLinkOver: () => void;
    handleLinkOut: (x: number, y: number) => void;
};

const DBNode: FC<DBNodeProps> = ({
    label, layout, handleDragStart, beginPath, isLinking, readyToLink, readyToBeLinked, handleLinkOver, handleLinkOut,
}) => {
    const [showTools, setShowTools] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => setShowTools(false), [label]);

    const handleMouseEnter = useCallback(() => {
        if (isLinking) {
            return;
        } else if (!readyToBeLinked) {
            setShowTools(true);
        } else {
            handleLinkOver();
        }
    }, [isLinking, readyToBeLinked, handleLinkOver]);

    const handleMouseLeave = useCallback((e: MouseEvent<HTMLDivElement>) => {
        if (isLinking) {
            return;
        } else if (!readyToBeLinked) {
            setShowTools(false);
        } else {
            handleLinkOut(e.clientX, e.clientY);
        }
    }, [isLinking, readyToBeLinked, handleLinkOut]);

    return (
        <Container
            style={{ left: `${layout.x}px`, top: `${layout.y}px` }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            ref={containerRef}
        >
            <DBBox
                draggable
                onDragStart={e => {
                    const target = e.target as HTMLSpanElement;
                    const box = target.getBoundingClientRect();
                    e.dataTransfer.setData('text/plain', label);
                    e.dataTransfer.dropEffect = 'move';
                    handleDragStart([
                        e.clientX - box.x,
                        e.clientY - box.y,
                    ]);
                }}
                title={label}
            >
                {label}
            </DBBox>
            {(isLinking || showTools) && readyToLink && (
                <>
                    <Button
                        style={{
                            right: 0,
                            top: '50%',
                            transform: 'translate(0, -50%)',
                        }}
                        onMouseDown={() => readyToLink && beginPath()}
                    />
                    <Button
                        style={{
                            left: 0,
                            top: '50%',
                            transform: 'translate(0, -50%)',
                        }}
                        onMouseDown={() => readyToLink && beginPath()}
                    />
                    <Button
                        style={{
                            left: '50%',
                            top: 0,
                            transform: 'translate(-50%, 0)',
                        }}
                        onMouseDown={() => readyToLink && beginPath()}
                    />
                    <Button
                        style={{
                            left: '50%',
                            bottom: 0,
                            transform: 'translate(-50%, 0)',
                        }}
                        onMouseDown={() => readyToLink && beginPath()}
                    />
                </>
            )}
        </Container>
    );
};


export default DBNode;
