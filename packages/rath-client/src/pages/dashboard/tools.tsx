import styled from 'styled-components';
import { useCallback, forwardRef } from 'react';
import { IconButton } from '@fluentui/react';
import type { DashboardCard } from '../../store/dashboardStore';
import Divider from '../../components/divider';

const ToolGroup = styled.div`
    margin: 0 0 0 0.6em;
    padding: 1.2em 0.5em 2em;
    display: flex;
    flex-shrink: 0 !important;
    flex-grow: 0 !important;
    flex-direction: column;
    background-color: #fff;
    overflow: hidden;
    > *:not(:last-child) {
        margin-bottom: 1em;
    }
`;

interface ToolsProps {
    items: DashboardCard[];
    clearPage: () => void;
}

const CANVAS_PADDING = 40;

const Tools = forwardRef<HTMLDivElement, ToolsProps>(({ items, clearPage }, ref) => {
    const { current: parent } = ref as { current: HTMLDivElement | null };

    const toCanvas = useCallback(
        (size = 4): [string, number, number] => {
            const container = parent?.children[0] as undefined | HTMLDivElement;

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const items = [...(container?.children ?? [])] as HTMLDivElement[];

            if (container && items.length > 0 && ctx) {
                const geometries = items.map<[number, number, number, number]>((div) => {
                    const rect = div.getBoundingClientRect();

                    return [rect.left, rect.top, rect.right, rect.bottom];
                });

                const [x1, y1, x2, y2] = geometries.reduce<[number, number, number, number]>(
                    ([x1, y1, x2, y2], geometry) => {
                        return [Math.min(x1, geometry[0]), Math.min(y1, geometry[1]), Math.max(x2, geometry[2]), Math.max(y2, geometry[3])];
                    },
                    [Infinity, Infinity, -Infinity, -Infinity]
                );

                const fx = (x: number) => (x - x1 + CANVAS_PADDING) * size;
                const fy = (y: number) => (y - y1 + CANVAS_PADDING) * size;

                const width = (x2 - x1 + CANVAS_PADDING * 2) * size;
                const height = (y2 - y1 + CANVAS_PADDING * 2) * size;

                canvas.width = width;
                canvas.height = height;
                ctx.fillStyle = '#fff';
                ctx.fillRect(CANVAS_PADDING * size, CANVAS_PADDING * size, (x2 - x1) * size, (y2 - y1) * size);

                items.forEach((div) => {
                    const c = div.querySelector('canvas');

                    if (c) {
                        const rect = c.getBoundingClientRect();
                        const x = fx(rect.left);
                        const y = fy(rect.top);
                        ctx.drawImage(c, 0, 0, c.width, c.height, x, y, rect.width * size, rect.height * size);
                    }
                });

                ctx.fillStyle = '#333';
                ctx.fillRect(0, 0, width, CANVAS_PADDING * size);
                ctx.fillRect(0, 0, CANVAS_PADDING * size, height);
                ctx.fillRect(width - CANVAS_PADDING * size, 0, CANVAS_PADDING * size, height);
                ctx.fillRect(0, height - CANVAS_PADDING * size, width, CANVAS_PADDING * size);
            } else {
                canvas.width = 600;
                canvas.height = 400;
            }

            return [canvas.toDataURL('image/png'), canvas.width, canvas.height];
        },
        [parent]
    );

    const open = useCallback(() => {
        const [data, w, h] = toCanvas(8);
        const image = document.createElement('img');
        image.src = data;
        image.width = w / 8;
        image.height = h / 8;
        const preview = window.open('');

        if (preview) {
            preview.document.title = 'dashboard preview';
            preview.document.write(image.outerHTML);
        }
    }, [toCanvas]);

    const download = useCallback(() => {
        const [data] = toCanvas(8);
        const a = document.createElement('a');
        a.href = data;
        a.download = 'dashboard';
        a.click();
    }, [toCanvas]);

    return (
        <ToolGroup>
            <IconButton
                onClick={clearPage}
                iconProps={{
                    iconName: 'DeleteTable',
                    style: {
                        color: '#fff',
                        backgroundColor: '#c50f1f',
                        padding: '6px',
                        boxSizing: 'content-box',
                        borderRadius: '6px',
                    },
                }}
            />
            <Divider />
            <IconButton
                disabled={items.length === 0}
                onClick={open}
                iconProps={{
                    iconName: 'OpenInNewWindow',
                    style: {
                        color: items.length === 0 ? '#666' : '#fff',
                        backgroundColor: items.length === 0 ? 'unset' : '#4f6bed',
                        padding: '6px',
                        boxSizing: 'content-box',
                        borderRadius: '6px',
                    },
                }}
            />
            <IconButton
                disabled={items.length === 0}
                onClick={download}
                iconProps={{
                    iconName: 'PhotoCollection',
                    style: {
                        color: items.length === 0 ? '#666' : '#fff',
                        backgroundColor: items.length === 0 ? 'unset' : '#546fd2',
                        padding: '6px',
                        boxSizing: 'content-box',
                        borderRadius: '6px',
                    },
                }}
            />
        </ToolGroup>
    );
});

export default Tools;
