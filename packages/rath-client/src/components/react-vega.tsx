import { useRef, useEffect, forwardRef, useImperativeHandle, Fragment, useMemo } from 'react';
import type { View } from 'vega';
import intl from 'react-intl-universal';
import embed, { vega } from 'vega-embed';
import { getVegaTimeFormatRules } from '../utils';
import type { VegaGlobalConfig } from '../queries/themes/config';
import ImageExportDialog, { type ImageExportDialogHandler } from './image-export-dialog';
import type { ImageExportInfo } from './image-export-dialog/export-image';

type VegaDataEntry = {
    name?: string;
    values?: unknown[];
    url?: string;
    source?: string | string[];
    [k: string]: unknown;
};

function withInlineDataValues(spec: any, values: unknown[]): any {
    const d = spec?.data;
    if (!d) {
        return {
            ...spec,
            data: { name: 'dataSource', values },
        };
    }
    if (Array.isArray(d)) {
        const nextData: VegaDataEntry[] = d.map((entry: any) => {
            if (!entry || typeof entry !== 'object') return entry;
            if (Array.isArray(entry.values)) {
                return { ...entry, values };
            }
            return entry;
        });
        return { ...spec, data: nextData };
    }
    if (typeof d === 'object') {
        return { ...spec, data: { ...d, values } };
    }
    return spec;
}

// Vega can emit noisy warnings like:
//   "WARN Infinite extent for field \"sum_count\": [Infinity, -Infinity]"
// which commonly happens when a view is computed over an empty dataset.
// This is usually harmless for the UI, so we suppress these specific warnings.
(() => {
    try {
        type VegaLogger = {
            __rathFiltered?: boolean;
            level?: (...args: unknown[]) => unknown;
            error?: (...args: unknown[]) => unknown;
            info?: (...args: unknown[]) => unknown;
            debug?: (...args: unknown[]) => unknown;
            warn?: (...args: unknown[]) => unknown;
        };
        const v = vega as unknown as {
            logger: (() => VegaLogger) & ((logger: VegaLogger) => void);
        };
        const base = v.logger();
        if (!base || base.__rathFiltered) return;
        const filtered: VegaLogger = {
            __rathFiltered: true,
            level: base.level ? base.level.bind(base) : undefined,
            error: base.error ? base.error.bind(base) : undefined,
            info: base.info ? base.info.bind(base) : undefined,
            debug: base.debug ? base.debug.bind(base) : undefined,
            warn: (...args: unknown[]) => {
                const msg = String(args[0] ?? '');
                if (msg.includes('Infinite extent for field')) return;
                return base.warn?.apply(base, args as unknown[]);
            },
        };
        v.logger(filtered);
    } catch {
        // ignore
    }
})();

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
        const sspec = withInlineDataValues(spec, dataSource as unknown[]);
        for (const key of ['width', 'height', 'autosize']) {
            if (key in sspec) {
                delete sspec[key];
            }
        }
        return sspec;
    }, [spec, dataSource]);
    const vegaSpec = useMemo(() => {
        // Reliability over micro-optimizations: embed with inline data so charts always render.
        // Some vega-lite compilation paths do not expose the named dataset in a way that `view.change()`
        // can reliably target across all specs.
        return withInlineDataValues(spec, dataSource as unknown[]);
    }, [spec, dataSource]);
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
            });
        }
        return () => {
            if (viewRef.current) {
                viewRef.current.finalize();
            }
        };
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
    return (
        <Fragment>
            <div ref={container} />
            <ImageExportDialog vegaViewRef={viewRef} spec={dynamicVegaSpec} vegaOpts={vegaOpts} ref={exportOptRef} />
        </Fragment>
    );
});

export default ReactVega;
