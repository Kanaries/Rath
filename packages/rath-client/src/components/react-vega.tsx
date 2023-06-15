import { useRef, useEffect, forwardRef, useImperativeHandle, Fragment, useMemo } from 'react';
import { View } from 'vega';
import intl from 'react-intl-universal';
import embed, { vega } from 'vega-embed';
import { getVegaTimeFormatRules } from '../utils';
import { VegaGlobalConfig } from '../queries/themes/config';
import ImageExportDialog, { ImageExportDialogHandler } from './image-export-dialog';
import type { ImageExportInfo } from './image-export-dialog/export-image';

interface ReactVegaProps {
    dataSource: readonly any[];
    spec: any;
    actions?: boolean;
    signalHandler?: {
        [key: string]: (name: any, value: any, view: View) => void;
    };
    config?: VegaGlobalConfig;
}

export interface IReactVegaHandler {
    getSVGData: () => Promise<string | null>;
    getCanvasData: () => Promise<string | null>;
    exportImage: () => Promise<ImageExportInfo | null>;
}

const ReactVega = forwardRef<IReactVegaHandler, ReactVegaProps>(function ReactVega (props, ref) {
    const { spec, dataSource, signalHandler = {}, actions, config } = props;
    const container = useRef<HTMLDivElement>(null);
    const viewRef = useRef<View>();
    const exportOptRef = useRef<ImageExportDialogHandler>(null);
    useImperativeHandle(ref, () => ({
        async getSVGData() {
            return viewRef.current?.toSVG() ?? null;
        },
        async getCanvasData() {
            return viewRef.current?.toCanvas().then(canvas => canvas.toDataURL('image/png')) ?? null;
        },
        async exportImage() {
            return exportOptRef.current?.open() ?? null;
        },
    }));
    const dynamicVegaSpec = useMemo(() => {
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
        for (const key of ['width', 'height', 'autosize']) {
            if (key in sspec) {
                delete sspec[key];
            }
        }
        return sspec;
    }, [spec, dataSource]);
    const vegaSpec = useMemo(() => {
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
        return sspec;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [spec]);
    const vegaOpts = useMemo(() => {
        return {
            timeFormatLocale: getVegaTimeFormatRules(intl.get('time_format.langKey')) as any,
            actions,
            config
        };
    }, [actions, config]);
    useEffect(() => {
        if (container.current) {
            embed(container.current, vegaSpec, vegaOpts).then((res) => {
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
    }, [vegaSpec, vegaOpts]);

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
    return (
        <Fragment>
            <div ref={container} />
            <ImageExportDialog vegaViewRef={viewRef} spec={dynamicVegaSpec} vegaOpts={vegaOpts} ref={exportOptRef} />
        </Fragment>
    );
});

export default ReactVega;
