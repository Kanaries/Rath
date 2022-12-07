import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View } from 'vega';
import intl from 'react-intl-universal';
import embed, { vega } from 'vega-embed';
import { EDITOR_URL } from '../constants';
import { getVegaTimeFormatRules } from '../utils';

interface ReactVegaProps {
    dataSource: readonly any[];
    spec: any;
    actions?: boolean;
    signalHandler?: {
        [key: string]: (name: any, value: any, view: View) => void;
    };
}

export interface IReactVegaHandler {
    getSVGData: () => Promise<string | null>;
    getCanvasData: () => Promise<string | null>;
    downloadSVG: () => Promise<boolean>;
    downloadPNG: () => Promise<boolean>;
}

const ReactVega = forwardRef<IReactVegaHandler, ReactVegaProps>(function ReactVega (props, ref) {
    const { spec, dataSource, signalHandler = {}, actions } = props;
    const container = useRef<HTMLDivElement>(null);
    const viewRef = useRef<View>();
    useImperativeHandle(ref, () => ({
        async getSVGData() {
            return viewRef.current?.toSVG() ?? null;
        },
        async getCanvasData() {
            return viewRef.current?.toCanvas().then(canvas => canvas.toDataURL('image/png')) ?? null;
        },
        async downloadSVG() {
            const data = (await viewRef.current?.toSVG()) ?? null;
            if (data) {
                const file = new File([data], 'image.svg');
                const url = URL.createObjectURL(file);
                const a = document.createElement('a');
                a.download = file.name;
                a.href = url;
                a.click();
                requestAnimationFrame(() => {
                    URL.revokeObjectURL(url);
                });
            }
            return false;
        },
        async downloadPNG() {
            const data = (await viewRef.current?.toCanvas().then(canvas => canvas.toDataURL('image/png'))) ?? null;
            if (data) {
                const a = document.createElement('a');
                a.download = 'image.png';
                a.href = data.replace(/^data:image\/[^;]/, 'data:application/octet-stream');
                a.click();
                return true;
            }
            return false;
        },
    }));
    useEffect(() => {
        if (container.current) {
            const sspec = {
                ...spec,
                data: {
                    ...spec.data,
                },
            };
            if (spec.data) {
                sspec.data = {
                    ...spec.data,
                };
            }
            sspec.data.values = dataSource;
            embed(container.current, sspec, {
                editorUrl: EDITOR_URL,
                timeFormatLocale: getVegaTimeFormatRules(intl.get('time_format.langKey')) as any,
                actions,
            }).then((res) => {
                const view = res.view;
                viewRef.current = view;
                for (let key in signalHandler) {
                    try {
                        view.addSignalListener(key, (n, v) => signalHandler[key](n, v, view));
                    } catch (error) {
                        console.warn(error);
                    }
                }
            });
        }
        return () => {
            if (viewRef.current) {
                viewRef.current.finalize();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [spec, actions]);

    useEffect(() => {
        if (viewRef.current && signalHandler) {
            for (let key in signalHandler) {
                try {
                    viewRef.current.addSignalListener(key, (n, v) => signalHandler[key](n, v, viewRef.current!));
                } catch (error) {
                    console.warn(error);
                }
            }
        }
        return () => {
            if (viewRef.current && signalHandler) {
                for (let key in signalHandler) {
                    try {
                        viewRef.current.removeSignalListener(key, (n, v) => signalHandler[key](n, v, viewRef.current!));
                    } catch (error) {
                        console.warn(error);
                    }
                }
            }
        };
    }, [signalHandler]);

    useEffect(() => {
        if (viewRef.current) {
            viewRef.current.change(
                'dataSource',
                vega
                    .changeset()
                    .remove(() => true)
                    .insert(dataSource)
            );
            viewRef.current.resize();
            viewRef.current.runAsync();
        }
    }, [dataSource]);
    return <div ref={container} />;
});

export default ReactVega;
