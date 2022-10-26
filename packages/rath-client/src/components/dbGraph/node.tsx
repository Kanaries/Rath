import { DragEvent, memo, MouseEvent, useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { DBBox } from ".";
import { IDBNode } from "./localTypes";


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

export interface DBNodeProps {
    node: IDBNode;
    handleDragStart: (e: DragEvent<HTMLSpanElement>) => void;
    beginPath: (e: MouseEvent<HTMLDivElement>) => void;
    id: number;
    linkingId: number | null;
    canLink: boolean;
    handleLinkOver: () => void;
    handleLinkOut: (e: MouseEvent<HTMLDivElement>) => void;
}

const DBNode = memo<DBNodeProps>(function DBNode({
    node, handleDragStart, beginPath, id, linkingId, canLink, handleLinkOver, handleLinkOut,
}) {
    const [active, setActive] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => setActive(false), [node]);

    const handleMouseEnter = useCallback(() => {
        if (linkingId === id) {
            return;
        } else if (linkingId === null) {
            setActive(true);
        } else {
            handleLinkOver();
        }
    }, [linkingId, id, handleLinkOver]);

    const handleMouseLeave = useCallback((e: MouseEvent<HTMLDivElement>) => {
        if (linkingId === id) {
            return;
        } else if (linkingId === null) {
            setActive(false);
        } else {
            handleLinkOut(e);
        }
    }, [linkingId, id, handleLinkOut]);

    return (
        <Container
            style={{ left: `${node.x}px`, top: `${node.y}px` }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            ref={containerRef}
        >
            <DBBox
                draggable
                onDragStart={handleDragStart}
                title={node.source}
            >
                {node.source}
            </DBBox>
            {(linkingId === id || (linkingId === null && active)) && canLink && (
                <>
                    <Button
                        style={{
                            right: 0,
                            top: '50%',
                            transform: 'translate(0, -50%)',
                        }}
                        onMouseDown={e => canLink && beginPath(e)}
                    />
                    <Button
                        style={{
                            left: 0,
                            top: '50%',
                            transform: 'translate(0, -50%)',
                        }}
                        onMouseDown={e => canLink && beginPath(e)}
                    />
                    <Button
                        style={{
                            left: '50%',
                            top: 0,
                            transform: 'translate(-50%, 0)',
                        }}
                        onMouseDown={e => canLink && beginPath(e)}
                    />
                    <Button
                        style={{
                            left: '50%',
                            bottom: 0,
                            transform: 'translate(-50%, 0)',
                        }}
                        onMouseDown={e => canLink && beginPath(e)}
                    />
                </>
            )}
        </Container>
    );
});


export default DBNode;
